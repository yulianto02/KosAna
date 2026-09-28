// api/repositories/reportsRepository.js - Scoped reports for revenue, occupancy, expenses
const pool = require('../db');
const { buildPropertyFilter } = require('../utils/scope');

class ReportsRepository {
  async getRevenue(options = {}) {
    // options: { propertyIds, propertyId, monthsBack: 6 }
    const monthsBack = options.monthsBack || 6;
    const propertyIds = options.propertyIds || null;
    const propertyId = options.propertyId || options.property_id || null;

    const months = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Des'];

    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const period = d.toISOString().slice(0, 7); // YYYY-MM
      const monthName = monthNames[d.getMonth()];
      const start = `${period}-01`;
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];

      // room revenue scoped
      let roomParams = [period];
      let roomWhere = `WHERE payment_status = 'paid' AND payment_period = $1`;
      if (propertyId) {
        roomParams.push(propertyId);
        roomWhere += ` AND property_id = $${roomParams.length}`;
      }
      if (propertyIds) {
        const { clause, params: scopeParams } = buildPropertyFilter(propertyIds, 'payments.property_id', roomParams.length);
        roomWhere += clause;
        roomParams = [...roomParams, ...scopeParams];
      }
      const roomRevRes = await pool.query(`SELECT COALESCE(SUM(total_amount),0) as rev FROM payments ${roomWhere}`, roomParams);

      // laundry revenue scoped
      let laundryParams = [start, end];
      let laundryWhere = `WHERE status = 'completed' AND order_date BETWEEN $1 AND $2`;
      if (propertyId) {
        laundryParams.push(propertyId);
        laundryWhere += ` AND property_id = $${laundryParams.length}`;
      }
      if (propertyIds) {
        const { clause, params: scopeParams } = buildPropertyFilter(propertyIds, 'laundry_orders.property_id', laundryParams.length);
        laundryWhere += clause;
        laundryParams = [...laundryParams, ...scopeParams];
      }
      const laundryRevRes = await pool.query(`SELECT COALESCE(SUM(total_price),0) as rev FROM laundry_orders ${laundryWhere}`, laundryParams);

      const roomRevenue = parseFloat(roomRevRes.rows[0].rev) || 0;
      const laundryRevenue = parseFloat(laundryRevRes.rows[0].rev) || 0;

      months.push({
        month: monthName,
        period,
        roomRevenue,
        laundryRevenue,
        totalRevenue: roomRevenue + laundryRevenue
      });
    }
    return months;
  }

  async getOccupancy(options = {}) {
    const propertyIds = options.propertyIds || null;
    const propertyId = options.propertyId || options.property_id || null;
    const monthsBack = options.monthsBack || 6;

    let roomParams = [];
    let roomWhere = 'WHERE 1=1';
    if (propertyId) {
      roomParams.push(propertyId);
      roomWhere += ` AND property_id = $${roomParams.length}`;
    }
    if (propertyIds) {
      const { clause, params: scopeParams } = buildPropertyFilter(propertyIds, 'rooms.property_id', roomParams.length);
      roomWhere += clause;
      roomParams = [...roomParams, ...scopeParams];
    }

    const roomsRes = await pool.query(`SELECT id, status FROM rooms ${roomWhere}`, roomParams);
    const totalRooms = roomsRes.rows.length;

    const months = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Des'];
    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthName = monthNames[d.getMonth()];
      const occupied = roomsRes.rows.filter(r => r.status === 'occupied').length;
      const vacant = roomsRes.rows.filter(r => r.status === 'available').length;
      months.push({
        month: monthName,
        occupied,
        vacant,
        total: totalRooms,
        rate: totalRooms > 0 ? Math.round((occupied / totalRooms) * 1000) / 10 : 0
      });
    }
    return months;
  }

  async getExpensesByCategory(options = {}) {
    // options: { propertyIds, propertyId, startDate, endDate }
    const propertyIds = options.propertyIds || null;
    const propertyId = options.propertyId || options.property_id || null;
    const startDate = options.startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const endDate = options.endDate || new Date().toISOString().split('T')[0];

    let params = [startDate, endDate];
    let where = `WHERE expense_date BETWEEN $1 AND $2`;

    if (propertyId) {
      params.push(propertyId);
      where += ` AND property_id = $${params.length}`;
    }
    if (propertyIds) {
      const { clause, params: scopeParams } = buildPropertyFilter(propertyIds, 'expenses.property_id', params.length);
      where += clause;
      params = [...params, ...scopeParams];
    }

    const result = await pool.query(`SELECT expense_type as category, SUM(amount) as amount FROM expenses ${where} GROUP BY expense_type`, params);
    const total = result.rows.reduce((sum, e) => sum + parseFloat(e.amount), 0);

    return result.rows.map(e => ({
      category: e.category,
      amount: parseFloat(e.amount),
      percentage: total > 0 ? Math.round((e.amount / total) * 1000) / 10 : 0
    }));
  }

  // Convenience wrappers for backward compat with old server.js
  async getRevenueByPeriod(period, options = {}) {
    // delegate to payments logic already scoped
    const { buildPropertyFilter } = require('../utils/scope');
    let params = [period];
    let where = `WHERE payment_status = 'paid' AND payment_period = $1`;
    if (options.propertyId) {
      params.push(options.propertyId);
      where += ` AND property_id = $${params.length}`;
    }
    if (options.propertyIds) {
      const { clause, params: scopeParams } = buildPropertyFilter(options.propertyIds, 'property_id', params.length);
      where += clause;
      params = [...params, ...scopeParams];
    }
    const res = await pool.query(`SELECT COALESCE(SUM(total_amount),0) as revenue FROM payments ${where}`, params);
    return res.rows[0].revenue;
  }
}

module.exports = new ReportsRepository();
