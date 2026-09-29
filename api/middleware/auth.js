const jwt = require('jsonwebtoken');
const pool = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const ACCESS_EXPIRES = '2h';
const REFRESH_EXPIRES = '30d';

async function getPropertyScopesForUser(userId) {
  const result = await pool.query(`
    SELECT 
      pm.property_id as "propertyId",
      r.code as role,
      pm.is_owner as "isOwner",
      COALESCE(array_agg(DISTINCT p.code) FILTER (WHERE p.code IS NOT NULL), '{}') as permissions
    FROM property_members pm
    JOIN roles r ON r.id = pm.role_id
    LEFT JOIN role_permissions rp ON rp.role_id = r.id
    LEFT JOIN permissions p ON p.id = rp.permission_id
    WHERE pm.user_id = $1
    GROUP BY pm.property_id, r.code, pm.is_owner, pm.assigned_at
    ORDER BY pm.assigned_at
  `, [userId]);
  return result.rows.map(r => ({
    propertyId: r.propertyId,
    role: r.role,
    isOwner: r.isOwner,
    permissions: r.permissions || []
  }));
}

async function getUserFullRecord(userId) {
  const res = await pool.query(`
    SELECT u.id, u.username, u.email, u.full_name, u.role as old_role, u.is_active, u.token_version,
           r.code as global_role, r.id as role_id
    FROM users u
    LEFT JOIN roles r ON r.id = u.role_id
    WHERE u.id = $1
  `, [userId]);
  return res.rows[0] || null;
}

function generateAccessToken(userRecord, propertyScopes) {
  const payload = {
    userId: userRecord.id,
    username: userRecord.username,
    globalRole: userRecord.global_role || userRecord.old_role,
    tokenVersion: userRecord.token_version,
    propertyScopes: propertyScopes
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_EXPIRES });
}

function generateRefreshToken(userRecord) {
  const payload = {
    userId: userRecord.id,
    tokenVersion: userRecord.token_version
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_EXPIRES });
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role, userId: user.id, tokenVersion: 1, propertyScopes: [] },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

async function revokeUserSessions(userId) {
  await pool.query(`UPDATE users SET token_version = token_version + 1, updated_at = NOW() WHERE id = $1`, [userId]);
  try {
    await pool.query(`INSERT INTO audit_logs (user_id, action, table_name, record_id) VALUES ($1, 'revoke_sessions', 'users', $2)`, [userId, userId]);
  } catch (e) {}
}

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId || decoded.id;
    if (!userId) return res.status(401).json({ error: 'Invalid token payload' });

    const userRecord = await getUserFullRecord(userId);
    if (!userRecord) return res.status(401).json({ error: 'User not found' });
    if (!userRecord.is_active) return res.status(401).json({ error: 'User account is deactivated' });

    if (typeof decoded.tokenVersion !== 'undefined' && decoded.tokenVersion !== userRecord.token_version) {
      return res.status(401).json({ error: 'Token revoked, please login again', code: 'TOKEN_REVOKED' });
    }

    let propertyScopes = decoded.propertyScopes;
    if (!propertyScopes) {
      propertyScopes = await getPropertyScopesForUser(userId);
    }

    const flatPermissions = [...new Set(propertyScopes.flatMap(s => s.permissions || []))];
    const isAdmin = (userRecord.global_role === 'admin' || userRecord.old_role === 'admin');

    req.user = {
      id: userRecord.id,
      userId: userRecord.id,
      username: userRecord.username,
      email: userRecord.email,
      fullName: userRecord.full_name,
      role: userRecord.global_role || userRecord.old_role,
      globalRole: userRecord.global_role || userRecord.old_role,
      oldRole: userRecord.old_role,
      tokenVersion: userRecord.token_version,
      propertyScopes,
      permissions: flatPermissions,
      isAdmin,
      is_owner: propertyScopes.some(s => s.isOwner)
    };
    req.userPermissions = isAdmin ? ['*'] : flatPermissions;
    req.userRole = userRecord.global_role || userRecord.old_role;
    req.tokenPayload = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Access token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

function getUserPermissions(req) {
  if (!req.user) return [];
  if (req.user.isAdmin) return ['*'];
  return req.userPermissions || req.user.permissions || [];
}

function getAccessiblePropertyIds(req) {
  if (!req.user) return [];
  if (req.user.isAdmin) return ['*'];
  return (req.user.propertyScopes || []).map(s => s.propertyId);
}

function hasPermission(req, permissionCode) {
  if (!req.user) return false;
  if (req.user.isAdmin) return true;
  if (req.user.globalRole === 'admin') return true;
  const perms = req.userPermissions || req.user.permissions || [];
  if (perms.includes('*')) return true;
  // support .view <-> .read alias
  if (perms.includes(permissionCode)) return true;
  const alt = permissionCode.includes('.view') ? permissionCode.replace('.view','.read') : permissionCode.replace('.read','.view');
  return perms.includes(alt);
}

function requirePermission(code) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (req.user.globalRole === 'admin' || req.user.role === 'admin' || req.user.isAdmin) {
      return next();
    }
    const perms = req.userPermissions || req.user.permissions || [];
    if (perms.includes('*')) return next();
    if (perms.includes(code)) return next();
    // alias .view <-> .read for backward compatibility with your seeded .read permissions
    const alt = code.includes('.view') ? code.replace('.view','.read') : code.replace('.read','.view');
    if (perms.includes(alt)) return next();
    return res.status(403).json({ error: `Insufficient permission: ${code}` });
  };
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    const globalRole = req.user.globalRole || req.user.role;
    const roleList = Array.isArray(roles) ? roles : [roles];
    if (roleList.includes(globalRole)) return next();
    const scopedRoles = (req.user.propertyScopes || []).map(s => s.role);
    if (scopedRoles.some(r => roleList.includes(r))) return next();
    return res.status(403).json({ error: 'Insufficient role' });
  };
}

module.exports = {
  generateToken,
  generateAccessToken,
  generateRefreshToken,
  authenticateToken,
  requireRole,
  requirePermission,
  hasPermission,
  getUserPermissions,
  getAccessiblePropertyIds,
  getPropertyScopesForUser,
  getUserFullRecord,
  revokeUserSessions,
  JWT_SECRET,
  ACCESS_EXPIRES,
  REFRESH_EXPIRES
};
