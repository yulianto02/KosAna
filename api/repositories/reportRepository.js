// ==================== REPORTS ====================
// Import reports repository at the top with other repositories
const reportsRepository = require('./repositories/reportsRepository');

app.get('/api/reports/revenue', authenticateToken, asyncHandler(async (req, res) => {
  const data = await reportsRepository.getRevenue();
  res.json(data);
}));

app.get('/api/reports/occupancy', authenticateToken, asyncHandler(async (req, res) => {
  const data = await reportsRepository.getOccupancy();
  res.json(data);
}));

app.get('/api/reports/expenses-by-category', authenticateToken, asyncHandler(async (req, res) => {
  const data = await reportsRepository.getExpensesByCategory();
  res.json(data);
}));