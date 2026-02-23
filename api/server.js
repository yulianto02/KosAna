const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
require('dotenv').config();
const pool = require('./db'); // Required for the pool.query calls in auth routes
const { generateToken, authenticateToken, requireRole } = require('./middleware/auth');


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

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://192.168.0.171:5173'],
  credentials: true
}));

app.use(express.json());

// Error handler middleware
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), database: 'PostgreSQL' });
});

// ==================== AUTHENTICATION ====================
app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  
  const result = await pool.query(
    'SELECT id, username, email, full_name, role, password_hash, is_active FROM users WHERE username = $1',
    [username]
  );
  
  if (result.rows.length === 0) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const user = result.rows[0];
  
  if (!user.is_active) {
    return res.status(401).json({ error: 'Account is deactivated' });
  }
  
  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Update last login
  await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);
  
  const token = generateToken(user);
  
  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.full_name,
      role: user.role
    }
  });
}));

app.post('/api/auth/register', asyncHandler(async (req, res) => {
  const { username, password, email, phone, fullName, role = 'penjaga' } = req.body;
  
  // Check if username or email exists
  const existing = await pool.query(
    'SELECT id FROM users WHERE username = $1 OR email = $2',
    [username, email]
  );
  
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'Username or email already exists' });
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const result = await pool.query(`
    INSERT INTO users (username, email, phone, password_hash, role, full_name)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, username, email, full_name, role, created_at
  `, [username, email, phone, hashedPassword, role, fullName]);
  
  const newUser = result.rows[0];
  const token = generateToken(newUser);
  
  res.status(201).json({
    token,
    user: newUser
  });
}));

// Protected route example - get current user
app.get('/api/auth/me', authenticateToken, asyncHandler(async (req, res) => {
  res.json(req.user);
}));

// Change password
app.post('/api/auth/change-password', authenticateToken, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
  const user = result.rows[0];
  
  const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
  if (!validPassword) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }
  
  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedNewPassword, req.user.id]);
  
  res.json({ message: 'Password changed successfully' });
}));

// ==================== DASHBOARD ====================
app.get('/api/dashboard/stats', asyncHandler(async (req, res) => {
  // Get stats from database
  const properties = await propertyRepository.findAll();
  const rooms = await roomRepository.findAll();
  const tenants = await tenantRepository.findAll('active');

  console.log('Properties count:', properties.length);
  console.log('Rooms count:', rooms.length);
  console.log('Active tenants count:', tenants.length);
  console.log('First property (if any):', properties[0] || 'none');
  console.log('First room status (if any):', rooms[0]?.status || 'none');
  
  const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
  const vacantRooms = rooms.filter(r => r.status === 'available').length;
  
  // Get current month revenue and expenses from views or calculate
  const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM
  const monthlyRevenue = await paymentRepository.getRevenueByPeriod(currentPeriod);
  
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const monthlyExpenses = await expenseRepository.getTotalByPropertyAndDate(
    null, 
    startOfMonth.toISOString().split('T')[0],
    new Date().toISOString().split('T')[0]
  );

  const pendingPayments = (await paymentRepository.findAll({ status: 'pending' })).length;
  const occupancyRate = rooms.length > 0 ? (occupiedRooms / rooms.length) * 100 : 0;

  res.json({
    total_properties: properties.length,
    total_rooms: rooms.length,
    occupied_rooms: occupiedRooms,
    vacant_rooms: vacantRooms,
    total_tenants: tenants.length,
    monthly_revenue: parseFloat(monthlyRevenue) || 0,
    monthly_expenses: parseFloat(monthlyExpenses) || 0,
    pending_payments: (await paymentRepository.findAll({ status: 'pending' })).length,
    occupancy_rate: rooms.length > 0 ? Math.round((occupiedRooms / rooms.length) * 1000) / 10 : 0
  });

  // res.json({
  //   totalProperties: properties.length,
  //   totalRooms: rooms.length,
  //   occupiedRooms,
  //   vacantRooms,
  //   totalTenants: tenants.length,
  //   monthlyRevenue: parseFloat(monthlyRevenue) || 0,
  //   monthlyExpenses: parseFloat(monthlyExpenses) || 0,
  //   pendingPayments,
  //   occupancyRate: Math.round(occupancyRate * 10) / 10
  // });
}));

// ==================== PROPERTIES ====================
app.get('/api/properties', asyncHandler(async (req, res) => {
  const properties = await propertyRepository.findAll();
  res.json(properties);
}));

app.get('/api/properties/:id', asyncHandler(async (req, res) => {
  const property = await propertyRepository.findById(req.params.id);
  if (!property) return res.status(404).json({ error: 'Property not found' });
  res.json(property);
}));

app.post('/api/properties', asyncHandler(async (req, res) => {
  const newProperty = await propertyRepository.create({
    ...req.body,
    totalFloors: req.body.totalFloors || 0,
    totalRooms: req.body.totalRooms || 0,
    status: 'active'
  });
  res.status(201).json(newProperty);
}));

app.put('/api/properties/:id', asyncHandler(async (req, res) => {
  const updated = await propertyRepository.update(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Property not found' });
  res.json(updated);
}));

app.delete('/api/properties/:id', asyncHandler(async (req, res) => {
  await propertyRepository.delete(req.params.id);
  res.json({ message: 'Property deleted' });
}));

// ==================== ROOMS ====================
app.get('/api/rooms', asyncHandler(async (req, res) => {
  const { propertyId } = req.query;
  const rooms = await roomRepository.findAll(propertyId);
  res.json(rooms);
}));

app.get('/api/rooms/:id', asyncHandler(async (req, res) => {
  const room = await roomRepository.findById(req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json(room);
}));

app.post('/api/rooms', asyncHandler(async (req, res) => {
  const newRoom = await roomRepository.create(req.body);
  res.status(201).json(newRoom);
}));

app.put('/api/rooms/:id', asyncHandler(async (req, res) => {
  const updated = await roomRepository.update(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Room not found' });
  res.json(updated);
}));

app.delete('/api/rooms/:id', asyncHandler(async (req, res) => {
  await roomRepository.delete(req.params.id);
  res.json({ message: 'Room deleted' });
}));

// ==================== TENANTS ====================
app.get('/api/tenants', asyncHandler(async (req, res) => {
  const { status } = req.query;
  const tenants = await tenantRepository.findAll(status);
  res.json(tenants);
}));

app.get('/api/tenants/:id', asyncHandler(async (req, res) => {
  const tenant = await tenantRepository.findById(req.params.id);
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
  res.json(tenant);
}));

app.post('/api/tenants', asyncHandler(async (req, res) => {
  const client = await require('./db').connect();
  
  try {
    await client.query('BEGIN');
    
    // Create tenant
    const newTenant = await tenantRepository.create({
      ...req.body,
      status: 'active'
    });
    
    // Update room status to occupied
    await roomRepository.updateStatus(req.body.roomId, 'occupied');
    
    await client.query('COMMIT');
    res.status(201).json(newTenant);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

app.put('/api/tenants/:id', asyncHandler(async (req, res) => {
  const updated = await tenantRepository.update(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Tenant not found' });
  res.json(updated);
}));

app.delete('/api/tenants/:id', asyncHandler(async (req, res) => {
  await tenantRepository.delete(req.params.id);
  res.json({ message: 'Tenant deleted' });
}));

// ==================== PAYMENTS ====================
app.get('/api/payments', asyncHandler(async (req, res) => {
  const { status, tenantId } = req.query;
  const payments = await paymentRepository.findAll({ status, tenantId });
  res.json(payments);
}));

app.get('/api/payments/:id', asyncHandler(async (req, res) => {
  const payment = await paymentRepository.findById(req.params.id);
  if (!payment) return res.status(404).json({ error: 'Payment not found' });
  res.json(payment);
}));

app.post('/api/payments', asyncHandler(async (req, res) => {
  const newPayment = await paymentRepository.create(req.body);
  res.status(201).json(newPayment);
}));

app.put('/api/payments/:id', asyncHandler(async (req, res) => {
  const updated = await paymentRepository.update(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Payment not found' });
  res.json(updated);
}));

app.delete('/api/payments/:id', asyncHandler(async (req, res) => {
  await paymentRepository.delete(req.params.id);
  res.json({ message: 'Payment deleted' });
}));

app.post('/api/payments/:id/mark-paid', asyncHandler(async (req, res) => {
  const updated = await paymentRepository.markAsPaid(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Payment not found' });
  res.json(updated);
}));

// ==================== EXPENSES ====================
app.get('/api/expenses', asyncHandler(async (req, res) => {
  const { propertyId, category } = req.query;
  const expenses = await expenseRepository.findAll({ propertyId, category });
  res.json(expenses);
}));

app.get('/api/expenses/:id', asyncHandler(async (req, res) => {
  const expense = await expenseRepository.findById(req.params.id);
  if (!expense) return res.status(404).json({ error: 'Expense not found' });
  res.json(expense);
}));

app.post('/api/expenses', asyncHandler(async (req, res) => {
  const newExpense = await expenseRepository.create({
    ...req.body,
    approvalStatus: 'pending'
  });
  res.status(201).json(newExpense);
}));

app.put('/api/expenses/:id', asyncHandler(async (req, res) => {
  const updated = await expenseRepository.update(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Expense not found' });
  res.json(updated);
}));

app.delete('/api/expenses/:id', asyncHandler(async (req, res) => {
  await expenseRepository.delete(req.params.id);
  res.json({ message: 'Expense deleted' });
}));

app.post('/api/expenses/:id/approve', asyncHandler(async (req, res) => {
  const { approvedBy } = req.body;
  const updated = await expenseRepository.approve(req.params.id, approvedBy);
  if (!updated) return res.status(404).json({ error: 'Expense not found' });
  res.json(updated);
}));

app.post('/api/expenses/:id/reject', asyncHandler(async (req, res) => {
  const { approvedBy } = req.body;
  const updated = await expenseRepository.reject(req.params.id, approvedBy);
  if (!updated) return res.status(404).json({ error: 'Expense not found' });
  res.json(updated);
}));

// ==================== LAUNDRY ====================
app.get('/api/laundry', asyncHandler(async (req, res) => {
  const { status } = req.query;
  const orders = await laundryRepository.findAll(status);
  res.json(orders);
}));

app.get('/api/laundry/:id', asyncHandler(async (req, res) => {
  const order = await laundryRepository.findById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Laundry order not found' });
  res.json(order);
}));

app.post('/api/laundry', asyncHandler(async (req, res) => {
  const newOrder = await laundryRepository.create({
    ...req.body,
    status: 'pending'
  });
  res.status(201).json(newOrder);
}));

app.put('/api/laundry/:id', asyncHandler(async (req, res) => {
  const updated = await laundryRepository.update(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Laundry order not found' });
  res.json(updated);
}));

app.delete('/api/laundry/:id', asyncHandler(async (req, res) => {
  await laundryRepository.delete(req.params.id);
  res.json({ message: 'Laundry order deleted' });
}));

app.post('/api/laundry/:id/complete', asyncHandler(async (req, res) => {
  const { completedBy } = req.body;
  const updated = await laundryRepository.complete(req.params.id, completedBy);
  if (!updated) return res.status(404).json({ error: 'Laundry order not found' });
  res.json(updated);
}));

// ==================== MAINTENANCE ====================
app.get('/api/maintenance', asyncHandler(async (req, res) => {
  const { status } = req.query;
  const requests = await maintenanceRepository.findAll(status);
  res.json(requests);
}));

app.get('/api/maintenance/:id', asyncHandler(async (req, res) => {
  const request = await maintenanceRepository.findById(req.params.id);
  if (!request) return res.status(404).json({ error: 'Maintenance request not found' });
  res.json(request);
}));

app.post('/api/maintenance', asyncHandler(async (req, res) => {
  const newRequest = await maintenanceRepository.create({
    ...req.body,
    status: 'reported',
    cost: 0
  });
  res.status(201).json(newRequest);
}));

app.put('/api/maintenance/:id', asyncHandler(async (req, res) => {
  const updated = await maintenanceRepository.update(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Maintenance request not found' });
  res.json(updated);
}));

app.delete('/api/maintenance/:id', asyncHandler(async (req, res) => {
  await maintenanceRepository.delete(req.params.id);
  res.json({ message: 'Maintenance request deleted' });
}));

app.post('/api/maintenance/:id/complete', asyncHandler(async (req, res) => {
  const updated = await maintenanceRepository.complete(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Maintenance request not found' });
  res.json(updated);
}));

app.post('/api/maintenance/:id/assign', asyncHandler(async (req, res) => {
  const { assignedTo } = req.body;
  const updated = await maintenanceRepository.assign(req.params.id, assignedTo);
  if (!updated) return res.status(404).json({ error: 'Maintenance request not found' });
  res.json(updated);
}));

// ==================== AC CLEANING ====================
app.get('/api/ac-cleaning', asyncHandler(async (req, res) => {
  const { status } = req.query;
  const schedules = await acCleaningRepository.findAll(status);
  res.json(schedules);
}));

app.get('/api/ac-cleaning/:id', asyncHandler(async (req, res) => {
  const schedule = await acCleaningRepository.findById(req.params.id);
  if (!schedule) return res.status(404).json({ error: 'AC cleaning schedule not found' });
  res.json(schedule);
}));

app.post('/api/ac-cleaning', asyncHandler(async (req, res) => {
  const newSchedule = await acCleaningRepository.create({
    ...req.body,
    status: 'pending',
    reminderSent: false
  });
  res.status(201).json(newSchedule);
}));

app.put('/api/ac-cleaning/:id', asyncHandler(async (req, res) => {
  const updated = await acCleaningRepository.update(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'AC cleaning schedule not found' });
  res.json(updated);
}));

app.delete('/api/ac-cleaning/:id', asyncHandler(async (req, res) => {
  await acCleaningRepository.delete(req.params.id);
  res.json({ message: 'AC cleaning schedule deleted' });
}));

app.post('/api/ac-cleaning/:id/complete', asyncHandler(async (req, res) => {
  const updated = await acCleaningRepository.complete(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'AC cleaning schedule not found' });
  res.json(updated);
}));

// ==================== NOTIFICATIONS ====================
app.get('/api/notifications', asyncHandler(async (req, res) => {
  const { userId, unreadOnly } = req.query;
  
  if (userId) {
    const notifications = await notificationRepository.findByUserId(userId, unreadOnly === 'true');
    return res.json(notifications);
  }
  
  const notifications = await notificationRepository.findAll();
  res.json(notifications);
}));

app.post('/api/notifications', asyncHandler(async (req, res) => {
  const newNotification = await notificationRepository.create({
    ...req.body,
    isRead: false
  });
  res.status(201).json(newNotification);
}));

app.put('/api/notifications/:id/read', asyncHandler(async (req, res) => {
  const updated = await notificationRepository.markAsRead(req.params.id);
  if (!updated) return res.status(404).json({ error: 'Notification not found' });
  res.json(updated);
}));

app.put('/api/notifications/mark-all-read', asyncHandler(async (req, res) => {
  const { userId } = req.body;
  await notificationRepository.markAllAsRead(userId);
  res.json({ message: 'All notifications marked as read' });
}));

// ==================== SETTINGS ====================
app.get('/api/settings', asyncHandler(async (req, res) => {
  const settings = await settingsRepository.getAll();
  res.json(settings);
}));

app.put('/api/settings', asyncHandler(async (req, res) => {
  const { updatedBy, ...settings } = req.body;
  const updated = await settingsRepository.updateMultiple(settings, updatedBy);
  res.json(updated);
}));

app.put('/api/settings/:key', asyncHandler(async (req, res) => {
  const { value, type, updatedBy, description } = req.body;
  const updated = await settingsRepository.set(req.params.key, value, type, updatedBy, description);
  res.json(updated);
}));

// ==================== REPORTS ====================
app.get('/api/reports/revenue', asyncHandler(async (req, res) => {
  // Generate last 6 months of data
  const months = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Des'];
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const period = d.toISOString().slice(0, 7);
    const monthName = monthNames[d.getMonth()];
    
    const roomRevenue = await paymentRepository.getRevenueByPeriod(period);
    const laundryRevenue = await laundryRepository.getRevenueByPeriod(
      `${period}-01`,
      `${period}-${new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()}`
    );
    
    months.push({
      month: monthName,
      roomRevenue: parseFloat(roomRevenue) || 0,
      laundryRevenue: parseFloat(laundryRevenue) || 0,
      totalRevenue: (parseFloat(roomRevenue) || 0) + (parseFloat(laundryRevenue) || 0)
    });
  }
  
  res.json(months);
}));

app.get('/api/reports/occupancy', asyncHandler(async (req, res) => {
  const rooms = await roomRepository.findAll();
  const totalRooms = rooms.length;
  
  // Generate last 6 months of occupancy data
  const months = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Des'];
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthName = monthNames[d.getMonth()];
    
    // This is simplified - in real app, you'd track historical occupancy
    const occupied = rooms.filter(r => r.status === 'occupied').length;
    const vacant = rooms.filter(r => r.status === 'available').length;
    
    months.push({
      month: monthName,
      occupied,
      vacant,
      rate: totalRooms > 0 ? Math.round((occupied / totalRooms) * 1000) / 10 : 0
    });
  }
  
  res.json(months);
}));

app.get('/api/reports/expenses-by-category', asyncHandler(async (req, res) => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  
  const expenses = await expenseRepository.getByCategory(
    null,
    startOfMonth.toISOString().split('T')[0],
    new Date().toISOString().split('T')[0]
  );
  
  const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  
  const data = expenses.map(e => ({
    category: e.category,
    amount: parseFloat(e.amount),
    percentage: total > 0 ? Math.round((e.amount / total) * 1000) / 10 : 0
  }));
  
  res.json(data);
}));

// ==================== ERROR HANDLING ====================
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: err.message || 'Internal server error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Kos Ana API Server running on port ${PORT}`);
  console.log(`📊 API URL: http://0.0.0.0: ${PORT}/api`);
  console.log(`💾 Database: PostgreSQL`);
});


module.exports = app;