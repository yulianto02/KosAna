const jwt = require('jsonwebtoken');
const pool = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const ACCESS_EXPIRES = '2h';
const REFRESH_EXPIRES = '30d';

// [STRIPPED 73 bytes]  Helpers
async function getPropertyScopesForUser(userId) {
  // Returns [{ propertyId, role, permissions: [] }]
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

  // For admin with no property_members yet (or '*' handling), still return scopes
  // But after migration admin should have members. Keep fallback.
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

// [STRIPPED 75 bytes]  Token generators
function generateAccessToken(userRecord, propertyScopes) {
  const payload = {
    userId: userRecord.id,
    username: userRecord.username,
    globalRole: userRecord.global_role || userRecord.old_role,
    tokenVersion: userRecord.token_version,
    propertyScopes: propertyScopes // [{ propertyId, role, permissions }]
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

// Legacy wrapper for compatibility
function generateToken(user) {
  // Will be used only by old code paths; delegate to access token with empty scopes
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role, userId: user.id, tokenVersion: 1, propertyScopes: [] },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// [STRIPPED 75 bytes]  Revocation helper
async function revokeUserSessions(userId) {
  await pool.query(`UPDATE users SET token_version = token_version + 1, updated_at = NOW() WHERE id = $1`, [userId]);
  // audit log optional
  try {
    await pool.query(`INSERT INTO audit_logs (user_id, action, table_name, record_id) VALUES ($1, 'revoke_sessions', 'users', $2)`, [userId, userId]);
  } catch (e) {}
}

// [STRIPPED 75 bytes]  Middleware: authenticate
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

    // token_version check - instant revocation
    if (typeof decoded.tokenVersion !== 'undefined' && decoded.tokenVersion !== userRecord.token_version) {
      return res.status(401).json({ error: 'Token revoked, please login again', code: 'TOKEN_REVOKED' });
    }

    // propertyScopes from token if present, else load fresh (fallback for old tokens)
    let propertyScopes = decoded.propertyScopes;
    if (!propertyScopes) {
      propertyScopes = await getPropertyScopesForUser(userId);
    }

    // Build flat permissions union
    const flatPermissions = [...new Set(propertyScopes.flatMap(s => s.permissions || []))];
    const isAdmin = (userRecord.global_role === 'admin' || userRecord.old_role === 'admin');

    req.user = {
      id: userRecord.id,
      userId: userRecord.id,
      username: userRecord.username,
      email: userRecord.email,
      fullName: userRecord.full_name,
      role: userRecord.global_role || userRecord.old_role, // global
      globalRole: userRecord.global_role || userRecord.old_role,
      oldRole: userRecord.old_role,
      tokenVersion: userRecord.token_version,
      propertyScopes,
      permissions: flatPermissions,
      isAdmin,
      is_owner: propertyScopes.some(s => s.isOwner)
    };
    // also attach decoded for debugging
    req.tokenPayload = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Access token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// [STRIPPED 75 bytes]  Helpers for RBAC in routes
function getUserPermissions(req) {
  if (!req.user) return [];
  if (req.user.isAdmin) return ['*'];
  return req.user.permissions || [];
}

function getAccessiblePropertyIds(req) {
  if (!req.user) return [];
  if (req.user.isAdmin) return ['*'];
  return (req.user.propertyScopes || []).map(s => s.propertyId);
}

function hasPermission(req, permissionCode) {
  if (!req.user) return false;
  if (req.user.isAdmin) return true;
  const perms = req.user.permissions || [];
  return perms.includes(permissionCode) || perms.includes('*');
}

function requirePermission(permissionCode) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (req.user.isAdmin) return next();
    if (hasPermission(req, permissionCode)) return next();
    return res.status(403).json({ error: `Insufficient permission: ${permissionCode}` });
  };
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    const globalRole = req.user.globalRole || req.user.role;
    const roleList = Array.isArray(roles) ? roles : [roles];
    if (roleList.includes(globalRole)) return next();
    // also allow if any propertyScope role matches
    const scopedRoles = (req.user.propertyScopes || []).map(s => s.role);
    if (scopedRoles.some(r => roleList.includes(r))) return next();
    return res.status(403).json({ error: 'Insufficient role' });
  };
}

module.exports = {
  generateToken, // legacy
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
