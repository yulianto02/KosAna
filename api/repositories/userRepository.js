const pool = require('../db');
const bcrypt = require('bcrypt');
const { revokeUserSessions } = require('../middleware/auth');

async function getRoleIdByCode(code) {
  const r = await pool.query('SELECT id FROM roles WHERE code = $1', [code]);
  return r.rows[0]?.id || null;
}

// FINAL V3 - 100% compatible with your \d output
// roles: id, code, name, is_system
// permissions: id, code, module, action, description
// users: id, username, email, phone, password_hash, role, full_name, is_active, role_id, token_version, etc
// properties: unknown columns - we will NOT select p.code to avoid error, only p.name and p.id

async function listUsers() {
  const usersRes = await pool.query(`
    SELECT u.id, u.username, u.email, u.full_name, u.is_active, u.created_at, u.last_login,
           u.role as legacy_role,
           r.id as role_id, r.code as role_code, r.name as role_name
    FROM users u
    LEFT JOIN roles r ON r.id = u.role_id
    ORDER BY u.full_name, u.username
  `);

  // IMPORTANT FIX: do NOT select p.code - properties table may not have code column
  // Only select p.id, p.name
  const assignRes = await pool.query(`
    SELECT pm.user_id, pm.property_id, pm.is_owner, pm.role_id,
           r.code as role_code, r.name as role_name,
           p.name as property_name
    FROM property_members pm
    JOIN properties p ON p.id = pm.property_id
    LEFT JOIN roles r ON r.id = pm.role_id
    ORDER BY p.name
  `);

  const byUser = {};
  for (const a of assignRes.rows) {
    if (!byUser[a.user_id]) byUser[a.user_id] = [];
    byUser[a.user_id].push({
      property_id: a.property_id,
      property_name: a.property_name,
      property_code: null, // no code column in properties
      role_id: a.role_id,
      role_code: a.role_code,
      role_name: a.role_name,
      is_owner: a.is_owner
    });
  }
  return usersRes.rows.map(u => ({
    id: u.id,
    username: u.username,
    email: u.email,
    full_name: u.full_name,
    is_active: u.is_active,
    created_at: u.created_at,
    last_login: u.last_login,
    role_id: u.role_id,
    role_code: u.role_code || u.legacy_role,
    role_name: u.role_name || u.legacy_role,
    assignments: byUser[u.id] || []
  }));
}

async function findById(id) {
  const users = await listUsers();
  return users.find(u => u.id === id) || null;
}

async function createUser({ username, email, full_name, password, role_code, is_active = true }) {
  if (!username || !password || !role_code) throw new Error('username, password, role required');
  const existing = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
  if (existing.rows.length) throw Object.assign(new Error('Username already exists'), { status: 409 });
  const role_id = await getRoleIdByCode(role_code);
  if (!role_id) throw Object.assign(new Error('Invalid role code: ' + role_code), { status: 400 });
  const hash = await bcrypt.hash(password, 10);
  const emailVal = email || `${username}@kosana.local`;
  const phoneVal = '0000000000';
  const idRes = await pool.query(
    `INSERT INTO users (id, username, email, phone, full_name, password_hash, role_id, role, is_active, token_version)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, 1)
     RETURNING id, username, email, full_name, is_active, created_at`,
    [username, emailVal, phoneVal, full_name || username, hash, role_id, role_code, is_active]
  );
  return idRes.rows[0];
}

async function updateUser(id, { email, full_name, role_code }) {
  let role_id = null;
  if (role_code) {
    role_id = await getRoleIdByCode(role_code);
    if (!role_id) throw Object.assign(new Error('Invalid role code'), { status: 400 });
  }
  const fields = []; const vals = []; let idx = 1;
  if (email !== undefined) { fields.push(`email = $${idx++}`); vals.push(email); }
  if (full_name !== undefined) { fields.push(`full_name = $${idx++}`); vals.push(full_name); }
  if (role_id) { fields.push(`role_id = $${idx++}`); vals.push(role_id); fields.push(`role = $${idx++}`); vals.push(role_code); }
  if (fields.length === 0) return findById(id);
  vals.push(id);
  const res = await pool.query(`UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING id`, vals);
  if (res.rows.length === 0) return null;
  return findById(id);
}

async function setActiveStatus(id, is_active) {
  const res = await pool.query('UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING id', [is_active, id]);
  if (res.rows.length === 0) return null;
  if (!is_active) { try { await revokeUserSessions(id); } catch(e){} }
  return findById(id);
}

async function resetPassword(id, newPassword) {
  if (!newPassword || newPassword.length < 6) throw Object.assign(new Error('Password min 6 chars'), { status: 400 });
  const hash = await bcrypt.hash(newPassword, 10);
  const res = await pool.query('UPDATE users SET password_hash = $1, token_version = token_version + 1, updated_at = NOW() WHERE id = $2 RETURNING id', [hash, id]);
  if (res.rows.length === 0) return null;
  try { await revokeUserSessions(id); } catch(e){}
  return { id };
}

async function setAssignments(userId, assignments) {
  const u = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
  if (u.rows.length === 0) return null;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM property_members WHERE user_id = $1', [userId]);
    for (const a of assignments) {
      const propertyId = a.propertyId || a.property_id;
      const roleId = a.roleId || a.role_id;
      const isOwner = a.isOwner || a.is_owner || false;
      if (!propertyId || !roleId) continue;
      await client.query(
        `INSERT INTO property_members (property_id, user_id, role_id, is_owner)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (property_id, user_id) DO UPDATE SET role_id = EXCLUDED.role_id, is_owner = EXCLUDED.is_owner`,
        [propertyId, userId, roleId, isOwner]
      );
    }
    await client.query('COMMIT');
  } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
  try { await revokeUserSessions(userId); } catch(e){}
  return findById(userId);
}

async function listRolesWithPermissions() {
  const rolesRes = await pool.query('SELECT id, code, name, is_system FROM roles ORDER BY name');
  const permsRes = await pool.query(`
    SELECT rp.role_id,
           p.id as perm_id,
           p.code as code,
           p.module as module,
           p.action as action,
           p.description as description
    FROM role_permissions rp
    JOIN permissions p ON p.id = rp.permission_id
    ORDER BY p.module, p.code
  `);
  const byRole = {};
  for (const row of permsRes.rows) {
    if (!byRole[row.role_id]) byRole[row.role_id] = [];
    byRole[row.role_id].push({
      id: row.perm_id,
      code: row.code,
      module: row.module,
      action: row.action,
      name: row.description || row.code,
      description: row.description
    });
  }
  const allPerms = await pool.query('SELECT id, code, module, action, description FROM permissions ORDER BY module, code');
  const allPermsMapped = allPerms.rows.map(r => ({
    id: r.id, code: r.code, module: r.module, action: r.action, name: r.description || r.code, description: r.description
  }));
  return {
    roles: rolesRes.rows.map(r => ({ id: r.id, code: r.code, name: r.name, is_system: r.is_system, permissions: byRole[r.id] || [] })),
    allPermissions: allPermsMapped,
    modules: [...new Set(allPerms.rows.map(p => p.module))].filter(Boolean)
  };
}

module.exports = { listUsers, findById, createUser, updateUser, setActiveStatus, resetPassword, setAssignments, listRolesWithPermissions, getRoleIdByCode };
