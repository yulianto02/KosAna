const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
require('dotenv').config();
const pool = require('./db');
const {
  generateToken,
  generateAccessToken,
  generateRefreshToken,
  authenticateToken,
  requireRole,
  requirePermission,
  getPropertyScopesForUser,
  getUserFullRecord,
  revokeUserSessions,
  getUserPermissions,
  getAccessiblePropertyIds,
  JWT_SECRET
} = require('./middleware/auth');
const jwt = require('jsonwebtoken');

// Import repositories
const propertyRepository = require('./repositories/propertyRepository');
const roomRepository = require('./repositories/roomRepository');
const tenantRepository = require('./repositories/tenantRepository');
const paymentRepository = require('./repositories/paymentRepository');
const expenseRepository = require('./repositories/expenseRepository');
const laundryRepository = require('./repositories/laundryRepository');
const maintenanceRepository = require('./repositories/maintenanceRepository');
const acCleaningRepository = require('./repositories/acCleaningRepository');
const notificationRepository = require('./repositories/notificationRepository');
const settingsRepository = require('./repositories/settingsRepository');
const auditLogRepo = require('./repositories/auditLogRepository');
const roomCleaningRepo = require('./repositories/roomCleaningRepository');
let reportsRepository;
try {
  reportsRepository = require('./repositories/reportsRepository');
} catch (e) {
  reportsRepository = require('./repositories/reportRepository');
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://192.168.0.101:5173'],
  credentials: true
}));
app.use(express.json());

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

function getScope(req) {
  const ids = getAccessiblePropertyIds(req);
  return { propertyIds: ids };
}

function assertPropertyInScope(propertyId, scope) {
  if (!propertyId) return true;
  if (scope.propertyIds.includes('*')) return true;
  return scope.propertyIds.includes(propertyId);
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), database: 'PostgreSQL' });
});

// ==================== AUTH ====================
app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  const result = await pool.query(
    `SELECT u.id, u.username, u.email, u.full_name, u.role as old_role, u.password_hash, u.is_active, u.token_version,
            r.code as global_role
     FROM users u LEFT JOIN roles r ON r.id = u.role_id
     WHERE u.username = $1`,
    [username]
  );
  if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
  const userRecord = result.rows[0];
  if (!userRecord.is_active) return res.status(401).json({ error: 'Account is deactivated' });
  const validPassword = await bcrypt.compare(password, userRecord.password_hash);
  if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });
  await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [userRecord.id]);
  const propertyScopes = await getPropertyScopesForUser(userRecord.id);
  const accessToken = generateAccessToken(userRecord, propertyScopes);
  const refreshToken = generateRefreshToken(userRecord);
  try { await pool.query(`INSERT INTO audit_logs (user_id, action, table_name, record_id) VALUES ($1,'login','users',$1)`, [userRecord.id]); } catch(e){}
  res.json({
    accessToken,
    refreshToken,
    token: accessToken,
    user: {
      id: userRecord.id,
      username: userRecord.username,
      email: userRecord.email,
      fullName: userRecord.full_name,
      role: userRecord.global_role || userRecord.old_role,
      globalRole: userRecord.global_role || userRecord.old_role,
      tokenVersion: userRecord.token_version
    },
    propertyScopes,
    permissions: [...new Set(propertyScopes.flatMap(s => s.permissions))]
  });
}));

app.post('/api/auth/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    const userId = decoded.userId;
    if (!userId) return res.status(401).json({ error: 'Invalid refresh payload' });
    const userRecord = await getUserFullRecord(userId);
    if (!userRecord) return res.status(401).json({ error: 'User not found' });
    if (!userRecord.is_active) return res.status(401).json({ error: 'Account deactivated', code: 'ACCOUNT_DEACTIVATED' });
    if (decoded.tokenVersion !== userRecord.token_version) {
      return res.status(401).json({ error: 'Refresh token revoked', code: 'TOKEN_REVOKED' });
    }
    const propertyScopes = await getPropertyScopesForUser(userId);
    const newAccessToken = generateAccessToken(userRecord, propertyScopes);
    const newRefreshToken = generateRefreshToken(userRecord);
    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken, token: newAccessToken });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Refresh token expired, please login again', code: 'REFRESH_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
}));

app.post('/api/auth/logout', authenticateToken, asyncHandler(async (req, res) => {
  try { await pool.query(`INSERT INTO audit_logs (user_id, action, table_name, record_id) VALUES ($1,'logout','users',$1)`, [req.user.id]); } catch(e){}
  res.json({ message: 'Logged out' });
}));

app.post('/api/auth/logout-all', authenticateToken, asyncHandler(async (req, res) => {
  await revokeUserSessions(req.user.id);
  res.json({ message: 'All sessions revoked, please login again' });
}));

app.get('/api/auth/me', authenticateToken, asyncHandler(async (req, res) => {
  const userRecord = await getUserFullRecord(req.user.id);
  const propertyScopes = await getPropertyScopesForUser(req.user.id);
  const flatPermissions = [...new Set(propertyScopes.flatMap(s => s.permissions))];
  const accessiblePropertyIds = getAccessiblePropertyIds(req);
  res.json({
    id: userRecord.id,
    username: userRecord.username,
    email: userRecord.email,
    fullName: userRecord.full_name,
    role: userRecord.global_role || userRecord.old_role,
    globalRole: userRecord.global_role || userRecord.old_role,
    isActive: userRecord.is_active,
    tokenVersion: userRecord.token_version,
    propertyScopes,
    permissions: req.user.isAdmin ? ['*'] : flatPermissions,
    accessiblePropertyIds,
    isAdmin: req.user.isAdmin
  });
}));

app.post('/api/auth/revoke/:userId', authenticateToken, asyncHandler(async (req, res) => {
  if (!req.user.isAdmin && !req.user.permissions.includes('users.manage')) {
    return res.status(403).json({ error: 'users.manage required' });
  }
  await revokeUserSessions(req.params.userId);
  res.json({ message: `Sessions revoked for user ${req.params.userId}` });
}));

// ==================== DASHBOARD - SCOPED ====================
app.get('/api/dashboard/stats', authenticateToken, asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const properties = await propertyRepository.findAll(scope);
  const rooms = await roomRepository.findAll(scope);
  const tenants = await tenantRepository.findAll({ status: 'active', ...scope });
  const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
  const vacantRooms = rooms.filter(r => r.status === 'available').length;
  const currentPeriod = new Date().toISOString().slice(0, 7);
  const monthlyRevenue = await paymentRepository.getRevenueByPeriod(currentPeriod, scope);
  const startOfMonth = new Date(); startOfMonth.setDate(1);
  const monthlyExpenses = await expenseRepository.getTotalByPropertyAndDate(null, startOfMonth.toISOString().split('T')[0], new Date().toISOString().split('T')[0], scope);
  const pendingPaymentsList = await paymentRepository.findAll({ status: 'pending', ...scope });
  res.json({
    total_properties: properties.length,
    total_rooms: rooms.length,
    occupied_rooms: occupiedRooms,
    vacant_rooms: vacantRooms,
    total_tenants: tenants.length,
    monthly_revenue: parseFloat(monthlyRevenue) || 0,
    monthly_expenses: parseFloat(monthlyExpenses) || 0,
    pending_payments: pendingPaymentsList.length,
    occupancy_rate: rooms.length > 0 ? Math.round((occupiedRooms / rooms.length) * 1000) / 10 : 0
  });
}));

// ==================== PROPERTIES - SCOPED ====================
app.get('/api/properties', authenticateToken, asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const properties = await propertyRepository.findAll(scope);
  res.json(properties);
}));

app.get('/api/properties/:id', authenticateToken, asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const property = await propertyRepository.findById(req.params.id, scope);
  if (!property) return res.status(404).json({ error: 'Property not found' });
  res.json(property);
}));

app.post('/api/properties', authenticateToken, requirePermission('properties.create'), asyncHandler(async (req, res) => {
  const newProperty = await propertyRepository.create({
    ...req.body,
    totalFloors: req.body.totalFloors || 0,
    totalRooms: req.body.totalRooms || 0,
    status: 'active'
  });
  try {
    await pool.query(`INSERT INTO property_members (property_id, user_id, role_id, is_owner) VALUES ($1,$2,(SELECT id FROM roles WHERE code='admin'), true) ON CONFLICT DO NOTHING`, [newProperty.id, req.user.id]);
  } catch(e) {}
  res.status(201).json(newProperty);
}));

app.put('/api/properties/:id', authenticateToken, requirePermission('properties.update'), asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const updated = await propertyRepository.update(req.params.id, req.body, scope);
  if (!updated) return res.status(404).json({ error: 'Property not found' });
  res.json(updated);
}));

app.delete('/api/properties/:id', authenticateToken, requirePermission('properties.delete'), asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const deleted = await propertyRepository.delete(req.params.id, scope);
  if (!deleted) return res.status(404).json({ error: 'Property not found' });
  res.json({ message: 'Property deleted' });
}));

// ==================== ROOMS - SCOPED ====================
app.get('/api/rooms', authenticateToken, asyncHandler(async (req, res) => {
  const { propertyId } = req.query;
  const scope = getScope(req);
  if (propertyId && !assertPropertyInScope(propertyId, scope)) return res.status(404).json({ error: 'Property not found' });
  const rooms = await roomRepository.findAll({ propertyId, ...scope });
  res.json(rooms);
}));

app.get('/api/rooms/:id', authenticateToken, asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const room = await roomRepository.findById(req.params.id, scope);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json(room);
}));

app.post('/api/rooms', authenticateToken, requirePermission('rooms.create'), asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const newRoom = await roomRepository.create(req.body, scope);
  res.status(201).json(newRoom);
}));

app.put('/api/rooms/:id', authenticateToken, requirePermission('rooms.update'), asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const updated = await roomRepository.update(req.params.id, req.body, scope);
  if (!updated) return res.status(404).json({ error: 'Room not found' });
  res.json(updated);
}));

app.delete('/api/rooms/:id', authenticateToken, requirePermission('rooms.delete'), asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const deleted = await roomRepository.delete(req.params.id, scope);
  if (!deleted) return res.status(404).json({ error: 'Room not found' });
  res.json({ message: 'Room deleted' });
}));

// ==================== TENANTS - SCOPED ====================
app.get('/api/tenants', authenticateToken, asyncHandler(async (req, res) => {
  const { status, propertyId } = req.query;
  const scope = getScope(req);
  if (propertyId && !assertPropertyInScope(propertyId, scope)) return res.status(404).json({ error: 'Property not found' });
  const tenants = await tenantRepository.findAll({ status, propertyId, ...scope });
  res.json(tenants);
}));

app.get('/api/tenants/:id', authenticateToken, asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const tenant = await tenantRepository.findById(req.params.id, scope);
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
  res.json(tenant);
}));

app.post('/api/tenants', authenticateToken, requirePermission('tenants.create'), asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const newTenant = await tenantRepository.create(req.body, scope);
  res.status(201).json(newTenant);
}));

app.put('/api/tenants/:id', authenticateToken, requirePermission('tenants.update'), asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const updated = await tenantRepository.update(req.params.id, req.body, scope);
  if (!updated) return res.status(404).json({ error: 'Tenant not found' });
  res.json(updated);
}));

app.delete('/api/tenants/:id', authenticateToken, requirePermission('tenants.delete'), asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const deleted = await tenantRepository.delete(req.params.id, scope);
  if (!deleted) return res.status(404).json({ error: 'Tenant not found' });
  res.json({ message: 'Tenant deleted' });
}));

// ==================== PAYMENTS - SCOPED ====================
app.get('/api/payments', authenticateToken, asyncHandler(async (req, res) => {
  const { status, tenantId, propertyId } = req.query;
  const scope = getScope(req);
  if (propertyId && !assertPropertyInScope(propertyId, scope)) return res.status(404).json({ error: 'Property not found' });
  const payments = await paymentRepository.findAll({ status, tenantId, propertyId, ...scope });
  res.json(payments);
}));

app.get('/api/payments/:id', authenticateToken, asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const payment = await paymentRepository.findById(req.params.id, scope);
  if (!payment) return res.status(404).json({ error: 'Payment not found' });
  res.json(payment);
}));

app.post('/api/payments', authenticateToken, requirePermission('payments.create'), asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const newPayment = await paymentRepository.create(req.body, scope);
  res.status(201).json(newPayment);
}));

app.put('/api/payments/:id', authenticateToken, requirePermission('payments.update'), asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const updated = await paymentRepository.update(req.params.id, req.body, scope);
  if (!updated) return res.status(404).json({ error: 'Payment not found' });
  res.json(updated);
}));

app.delete('/api/payments/:id', authenticateToken, requirePermission('payments.delete'), asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const deleted = await paymentRepository.delete(req.params.id, scope);
  if (!deleted) return res.status(404).json({ error: 'Payment not found' });
  res.json({ message: 'Payment deleted' });
}));

app.post('/api/payments/:id/mark-paid', authenticateToken, requirePermission('payments.update'), asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const updated = await paymentRepository.markAsPaid(req.params.id, req.body, scope);
  if (!updated) return res.status(404).json({ error: 'Payment not found' });
  res.json(updated);
}));

// ==================== EXPENSES - SCOPED ====================
app.get('/api/expenses', authenticateToken, asyncHandler(async (req, res) => {
  const { propertyId, category, approval_status } = req.query;
  const scope = getScope(req);
  if (propertyId && !assertPropertyInScope(propertyId, scope)) return res.status(404).json({ error: 'Property not found' });
  const expenses = await expenseRepository.findAll({ property_id: propertyId, propertyId, category, approval_status, ...scope });
  res.json(expenses);
}));

app.get('/api/expenses/:id', authenticateToken, asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const expense = await expenseRepository.findById(req.params.id, scope);
  if (!expense) return res.status(404).json({ error: 'Expense not found' });
  res.json(expense);
}));

app.post('/api/expenses', authenticateToken, requirePermission('expenses.create'), asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const newExpense = await expenseRepository.create({ ...req.body, approval_status: 'pending' }, scope);
  res.status(201).json(newExpense);
}));

app.put('/api/expenses/:id', authenticateToken, requirePermission('expenses.update'), asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const updated = await expenseRepository.update(req.params.id, req.body, scope);
  if (!updated) return res.status(404).json({ error: 'Expense not found' });
  res.json(updated);
}));

app.delete('/api/expenses/:id', authenticateToken, requirePermission('expenses.delete'), asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const deleted = await expenseRepository.delete(req.params.id, scope);
  if (!deleted) return res.status(404).json({ error: 'Expense not found' });
  res.json({ message: 'Expense deleted' });
}));

app.post('/api/expenses/:id/approve', authenticateToken, requirePermission('expenses.approve'), asyncHandler(async (req, res) => {
  const { approvedBy } = req.body;
  const scope = getScope(req);
  const updated = await expenseRepository.approve(req.params.id, approvedBy, scope);
  if (!updated) return res.status(404).json({ error: 'Expense not found' });
  res.json(updated);
}));

app.post('/api/expenses/:id/reject', authenticateToken, requirePermission('expenses.approve'), asyncHandler(async (req, res) => {
  const { approvedBy } = req.body;
  const scope = getScope(req);
  const updated = await expenseRepository.reject(req.params.id, approvedBy, scope);
  if (!updated) return res.status(404).json({ error: 'Expense not found' });
  res.json(updated);
}));

// ==================== ROOM CLEANING - SCOPED (Step 4) ====================
app.get('/api/room-cleaning', authenticateToken, asyncHandler(async (req, res) => {
  const { propertyId, weekStart } = req.query;
  if (!propertyId || !weekStart) return res.status(400).json({ error: 'propertyId and weekStart are required' });
  const scope = getScope(req);
  if (!assertPropertyInScope(propertyId, scope)) return res.status(404).json({ error: 'Property not found' });
  const schedules = await roomCleaningRepo.findByPropertyAndWeek(propertyId, weekStart, scope);
  res.json(schedules);
}));

app.get('/api/room-cleaning/:id', authenticateToken, asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const schedule = await roomCleaningRepo.findById(req.params.id, scope);
  if (!schedule) return res.status(404).json({ error: 'Schedule not found' });
  res.json(schedule);
}));

app.post('/api/room-cleaning', authenticateToken, asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const pid = req.body.property_id || req.body.propertyId;
  if (pid && !assertPropertyInScope(pid, scope)) return res.status(404).json({ error: 'Property not found' });
  const { room_id, property_id, week_start_date, day_of_week, time_slot, assigned_to, notes } = req.body;
  const weekStart = new Date(week_start_date);
  const scheduledDate = new Date(weekStart);
  scheduledDate.setDate(weekStart.getDate() + parseInt(day_of_week));
  const hour = time_slot <= 3 ? 9 + (time_slot - 1) : 13 + (time_slot - 4);
  scheduledDate.setHours(hour, 0, 0, 0);
  const schedule = await roomCleaningRepo.create({
    room_id, property_id, week_start_date, day_of_week: parseInt(day_of_week), time_slot: parseInt(time_slot),
    scheduled_date: scheduledDate.toISOString(), assigned_to, notes
  }, scope);
  await auditLogRepo.create({ user_id: req.user.id, action: 'CREATE', table_name: 'room_cleaning_schedule', record_id: schedule.id, new_data: schedule });
  res.status(201).json(schedule);
}));

app.put('/api/room-cleaning/:id', authenticateToken, asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const updates = req.body;
  const existing = await roomCleaningRepo.findById(req.params.id, scope);
  if (!existing) return res.status(404).json({ error: 'Schedule not found' });
  if (updates.day_of_week !== undefined || updates.time_slot !== undefined) {
    const weekStart = new Date(existing.week_start_date);
    const dayOfWeek = updates.day_of_week !== undefined ? parseInt(updates.day_of_week) : existing.day_of_week;
    const timeSlot = updates.time_slot !== undefined ? parseInt(updates.time_slot) : existing.time_slot;
    const scheduledDate = new Date(weekStart);
    scheduledDate.setDate(weekStart.getDate() + dayOfWeek);
    const hour = timeSlot <= 3 ? 9 + (timeSlot - 1) : 13 + (timeSlot - 4);
    scheduledDate.setHours(hour, 0, 0, 0);
    updates.scheduled_date = scheduledDate.toISOString();
  }
  const schedule = await roomCleaningRepo.update(req.params.id, updates, scope);
  await auditLogRepo.create({ user_id: req.user.id, action: 'UPDATE', table_name: 'room_cleaning_schedule', record_id: req.params.id, new_data: schedule });
  res.json(schedule);
}));

app.post('/api/room-cleaning/:id/start', authenticateToken, asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const schedule = await roomCleaningRepo.markInProgress(req.params.id, scope);
  if (!schedule) return res.status(404).json({ error: 'Schedule not found' });
  await auditLogRepo.create({ user_id: req.user.id, action: 'START', table_name: 'room_cleaning_schedule', record_id: req.params.id });
  res.json(schedule);
}));

app.post('/api/room-cleaning/:id/complete', authenticateToken, asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const { notes, actual_duration } = req.body;
  const schedule = await roomCleaningRepo.complete(req.params.id, req.user.id, notes, actual_duration, scope);
  if (!schedule) return res.status(404).json({ error: 'Schedule not found' });
  await auditLogRepo.create({ user_id: req.user.id, action: 'COMPLETE', table_name: 'room_cleaning_schedule', record_id: req.params.id });
  res.json(schedule);
}));

app.post('/api/room-cleaning/:id/skip', authenticateToken, asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const { reason } = req.body;
  const schedule = await roomCleaningRepo.skip(req.params.id, reason, scope);
  if (!schedule) return res.status(404).json({ error: 'Schedule not found' });
  await auditLogRepo.create({ user_id: req.user.id, action: 'SKIP', table_name: 'room_cleaning_schedule', record_id: req.params.id });
  res.json(schedule);
}));

app.delete('/api/room-cleaning/:id', authenticateToken, requireRole('admin'), asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const deleted = await roomCleaningRepo.delete(req.params.id, scope);
  if (!deleted) return res.status(404).json({ error: 'Schedule not found' });
  await auditLogRepo.create({ user_id: req.user.id, action: 'DELETE', table_name: 'room_cleaning_schedule', record_id: req.params.id });
  res.json({ message: 'Schedule deleted' });
}));

app.post('/api/room-cleaning/generate', authenticateToken, asyncHandler(async (req, res) => {
  const { propertyId, weekStart } = req.body;
  const scope = getScope(req);
  if (!assertPropertyInScope(propertyId, scope)) return res.status(404).json({ error: 'Property not found' });
  const count = await roomCleaningRepo.generateSchedule(propertyId, weekStart, scope);
  await auditLogRepo.create({ user_id: req.user.id, action: 'GENERATE_SCHEDULE', table_name: 'room_cleaning_schedule', record_id: propertyId, details: { week_start: weekStart, rooms_scheduled: count } });
  res.json({ message: `${count} rooms scheduled`, count });
}));

app.get('/api/room-cleaning/slots', authenticateToken, asyncHandler(async (req, res) => {
  const { propertyId, weekStart } = req.query;
  const scope = getScope(req);
  if (!assertPropertyInScope(propertyId, scope)) return res.status(404).json({ error: 'Property not found' });
  const slots = await roomCleaningRepo.getAvailableSlots(propertyId, weekStart, scope);
  res.json(slots);
}));

app.get('/api/room-cleaning/stats', authenticateToken, asyncHandler(async (req, res) => {
  const { propertyId, weekStart } = req.query;
  const scope = getScope(req);
  if (!assertPropertyInScope(propertyId, scope)) return res.status(404).json({ error: 'Property not found' });
  const stats = await roomCleaningRepo.getStats(propertyId, weekStart, scope);
  res.json(stats);
}));

app.get('/api/room-cleaning/room/:roomId/history', authenticateToken, asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const history = await roomCleaningRepo.getRoomHistory(req.params.roomId, 10, scope);
  res.json(history);
}));

// ==================== LAUNDRY - SCOPED (Step 4) ====================
app.get('/api/laundry', authenticateToken, asyncHandler(async (req, res) => {
  const { status, propertyId, tenantId } = req.query;
  const scope = getScope(req);
  if (propertyId && !assertPropertyInScope(propertyId, scope)) return res.status(404).json({ error: 'Property not found' });
  const orders = await laundryRepository.findAll({ status, propertyId, tenantId, ...scope });
  res.json(orders);
}));

app.get('/api/laundry/:id', authenticateToken, asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const order = await laundryRepository.findById(req.params.id, scope);
  if (!order) return res.status(404).json({ error: 'Laundry order not found' });
  res.json(order);
}));

app.post('/api/laundry', authenticateToken, requirePermission('laundry.create'), asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const pid = req.body.property_id || req.body.propertyId;
  if (pid && !assertPropertyInScope(pid, scope)) return res.status(404).json({ error: 'Property not found' });
  const newOrder = await laundryRepository.create({ ...req.body, status: 'pending' }, scope);
  res.status(201).json(newOrder);
}));

app.put('/api/laundry/:id', authenticateToken, requirePermission('laundry.create'), asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const updated = await laundryRepository.update(req.params.id, req.body, scope);
  if (!updated) return res.status(404).json({ error: 'Laundry order not found' });
  res.json(updated);
}));

app.delete('/api/laundry/:id', authenticateToken, requirePermission('laundry.create'), asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const deleted = await laundryRepository.delete(req.params.id, scope);
  if (!deleted) return res.status(404).json({ error: 'Laundry order not found' });
  res.json({ message: 'Laundry order deleted' });
}));

app.post('/api/laundry/:id/complete', authenticateToken, requirePermission('laundry.complete'), asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const { completedBy } = req.body;
  const updated = await laundryRepository.complete(req.params.id, completedBy, scope);
  if (!updated) return res.status(404).json({ error: 'Laundry order not found' });
  res.json(updated);
}));

// ==================== MAINTENANCE - SCOPED ====================
app.get('/api/maintenance', authenticateToken, asyncHandler(async (req, res) => {
  const { status, propertyId } = req.query;
  const scope = getScope(req);
  if (propertyId && !assertPropertyInScope(propertyId, scope)) return res.status(404).json({ error: 'Property not found' });
  const requests = await maintenanceRepository.findAll({ status, propertyId, ...scope });
  res.json(requests);
}));

app.get('/api/maintenance/:id', authenticateToken, asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const request = await maintenanceRepository.findById(req.params.id, scope);
  if (!request) return res.status(404).json({ error: 'Maintenance request not found' });
  res.json(request);
}));

app.post('/api/maintenance', authenticateToken, requirePermission('maintenance.create'), asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const newRequest = await maintenanceRepository.create({ ...req.body, status: 'reported', cost: 0 }, scope);
  res.status(201).json(newRequest);
}));

app.put('/api/maintenance/:id', authenticateToken, requirePermission('maintenance.update'), asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const updated = await maintenanceRepository.update(req.params.id, req.body, scope);
  if (!updated) return res.status(404).json({ error: 'Maintenance request not found' });
  res.json(updated);
}));

app.delete('/api/maintenance/:id', authenticateToken, requirePermission('maintenance.delete'), asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const deleted = await maintenanceRepository.delete(req.params.id, scope);
  if (!deleted) return res.status(404).json({ error: 'Maintenance request not found' });
  res.json({ message: 'Maintenance request deleted' });
}));

app.post('/api/maintenance/:id/complete', authenticateToken, requirePermission('maintenance.update'), asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const updated = await maintenanceRepository.complete(req.params.id, req.body, scope);
  if (!updated) return res.status(404).json({ error: 'Maintenance request not found' });
  res.json(updated);
}));

app.post('/api/maintenance/:id/assign', authenticateToken, requirePermission('maintenance.update'), asyncHandler(async (req, res) => {
  const { assignedTo } = req.body;
  const scope = getScope(req);
  const updated = await maintenanceRepository.assign(req.params.id, assignedTo, scope);
  if (!updated) return res.status(404).json({ error: 'Maintenance request not found' });
  res.json(updated);
}));

// ==================== AC CLEANING - SCOPED (Step 4) ====================
app.get('/api/ac-cleaning', authenticateToken, asyncHandler(async (req, res) => {
  const { status, propertyId } = req.query;
  const scope = getScope(req);
  if (propertyId && !assertPropertyInScope(propertyId, scope)) return res.status(404).json({ error: 'Property not found' });
  const schedules = await acCleaningRepository.findAll({ status, propertyId, ...scope });
  res.json(schedules);
}));

app.get('/api/ac-cleaning/:id', authenticateToken, asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const schedule = await acCleaningRepository.findById(req.params.id, scope);
  if (!schedule) return res.status(404).json({ error: 'AC cleaning schedule not found' });
  res.json(schedule);
}));

app.post('/api/ac-cleaning', authenticateToken, requirePermission('room_cleaning.schedule'), asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const pid = req.body.property_id || req.body.propertyId;
  if (pid && !assertPropertyInScope(pid, scope)) return res.status(404).json({ error: 'Property not found' });
  const newSchedule = await acCleaningRepository.create({ ...req.body, status: 'pending' }, scope);
  res.status(201).json(newSchedule);
}));

app.put('/api/ac-cleaning/:id', authenticateToken, requirePermission('room_cleaning.schedule'), asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const updated = await acCleaningRepository.update(req.params.id, req.body, scope);
  if (!updated) return res.status(404).json({ error: 'AC cleaning schedule not found' });
  res.json(updated);
}));

app.delete('/api/ac-cleaning/:id', authenticateToken, requirePermission('room_cleaning.schedule'), asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const deleted = await acCleaningRepository.delete(req.params.id, scope);
  if (!deleted) return res.status(404).json({ error: 'AC cleaning schedule not found' });
  res.json({ message: 'AC cleaning schedule deleted' });
}));

app.post('/api/ac-cleaning/:id/complete', authenticateToken, requirePermission('room_cleaning.complete'), asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const updated = await acCleaningRepository.complete(req.params.id, req.body, scope);
  if (!updated) return res.status(404).json({ error: 'AC cleaning schedule not found' });
  res.json(updated);
}));

// ==================== NOTIFICATIONS - SCOPED ====================
app.get('/api/notifications', authenticateToken, asyncHandler(async (req, res) => {
  const { userId, unreadOnly } = req.query;
  const scope = getScope(req);
  // Admin can see all or filter by userId
  if (req.user.isAdmin) {
    if (userId) {
      const notifications = await notificationRepository.findByUserId(userId, unreadOnly === 'true');
      return res.json(notifications);
    }
    const notifications = await notificationRepository.findAll();
    return res.json(notifications);
  }
  // Non-admin: only own notifications
  const notifications = await notificationRepository.findByUserId(req.user.id, unreadOnly === 'true');
  res.json(notifications);
}));

app.post('/api/notifications', authenticateToken, requireRole(['admin','manager']), asyncHandler(async (req, res) => {
  const newNotification = await notificationRepository.create({ ...req.body, isRead: false });
  res.status(201).json(newNotification);
}));

app.put('/api/notifications/:id/read', authenticateToken, asyncHandler(async (req, res) => {
  const notification = await notificationRepository.findById(req.params.id);
  if (!notification) return res.status(404).json({ error: 'Notification not found' });
  if (!req.user.isAdmin && notification.user_id !== req.user.id) return res.status(404).json({ error: 'Notification not found' });
  const updated = await notificationRepository.markAsRead(req.params.id);
  res.json(updated);
}));

app.put('/api/notifications/mark-all-read', authenticateToken, asyncHandler(async (req, res) => {
  const targetUserId = req.user.isAdmin ? (req.body.userId || req.user.id) : req.user.id;
  await notificationRepository.markAllAsRead(targetUserId);
  res.json({ message: 'All notifications marked as read' });
}));

// ==================== SETTINGS - ADMIN ONLY (no scoping) ====================
app.get('/api/settings', authenticateToken, requireRole('admin'), asyncHandler(async (req, res) => {
  const settings = await settingsRepository.getAll();
  res.json(settings);
}));

app.put('/api/settings', authenticateToken, requirePermission('settings.update'), asyncHandler(async (req, res) => {
  const { updatedBy, ...settings } = req.body;
  const updated = await settingsRepository.updateMultiple(settings, updatedBy || req.user.id);
  res.json(updated);
}));

app.put('/api/settings/:key', authenticateToken, requirePermission('settings.update'), asyncHandler(async (req, res) => {
  const { value, type, updatedBy, description } = req.body;
  const updated = await settingsRepository.set(req.params.key, value, type, updatedBy || req.user.id, description);
  res.json(updated);
}));

// ==================== REPORTS - SCOPED (Step 4) ====================
app.get('/api/reports/revenue', authenticateToken, asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const { propertyId } = req.query;
  if (propertyId && !assertPropertyInScope(propertyId, scope)) return res.status(404).json({ error: 'Property not found' });
  const data = await reportsRepository.getRevenue({ ...scope, propertyId });
  res.json(data);
}));

app.get('/api/reports/occupancy', authenticateToken, asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const { propertyId } = req.query;
  if (propertyId && !assertPropertyInScope(propertyId, scope)) return res.status(404).json({ error: 'Property not found' });
  const data = await reportsRepository.getOccupancy({ ...scope, propertyId });
  res.json(data);
}));

app.get('/api/reports/expenses-by-category', authenticateToken, asyncHandler(async (req, res) => {
  const scope = getScope(req);
  const { propertyId, startDate, endDate } = req.query;
  if (propertyId && !assertPropertyInScope(propertyId, scope)) return res.status(404).json({ error: 'Property not found' });
  const startOfMonth = new Date(); startOfMonth.setDate(1);
  const data = await reportsRepository.getExpensesByCategory({
    ...scope,
    propertyId,
    startDate: startDate || startOfMonth.toISOString().split('T')[0],
    endDate: endDate || new Date().toISOString().split('T')[0]
  });
  res.json(data);
}));

// ==================== USERS - ADMIN ====================
app.get('/api/users', authenticateToken, requirePermission('users.view'), asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT id, username, email, full_name, role, is_active, created_at FROM users WHERE is_active = true ORDER BY full_name, username');
  res.json(result.rows);
}));

// ==================== AUDIT LOGS - ADMIN ONLY ====================
app.get('/api/audit-logs', authenticateToken, requireRole('admin'), asyncHandler(async (req, res) => {
  const { limit = 100, offset = 0 } = req.query;
  const result = await pool.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
  res.json(result.rows);
}));

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error', stack: process.env.NODE_ENV === 'development' ? err.stack : undefined });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Kos Ana API Server running on port ${PORT}`);
  console.log(`📊 API URL: http://0.0.0.0: ${PORT}/api`);
  console.log(`💾 Database: PostgreSQL - Scoped v4 (Step 4 complete - laundry, AC, room cleaning, reports, notifications, settings admin-only)`);
});

module.exports = app;
