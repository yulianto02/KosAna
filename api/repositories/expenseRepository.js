// api/repositories/expenseRepository.js - Scoped, adapted to your existing schema
const pool = require('../db');
const { buildPropertyFilter } = require('../utils/scope');

class ExpenseRepository {
  async findAll(params = {}) {
    // params: { property_id, propertyId, category, approval_status, propertyIds, startDate, endDate }
    let query = 'SELECT * FROM expenses';
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    // Single property filter (legacy)
    const singlePropId = params.property_id || params.propertyId || params.propertyID;
    if (singlePropId) {
      conditions.push(`property_id = $${paramIndex}`);
      values.push(singlePropId);
      paramIndex++;
    }

    // Scope filter
    const propertyIds = params.propertyIds;
    if (propertyIds) {
      const { clause, params: scopeParams } = buildPropertyFilter(propertyIds, 'expenses.property_id', values.length);
      if (clause) {
        // clause starts with " AND", strip it for WHERE
        conditions.push(clause.replace(/^ AND /, ''));
        values.push(...scopeParams);
        paramIndex = values.length + 1;
      } else if (clause.includes('1=0')) {
        // No access -> force empty
        query += ' WHERE 1=0';
        const result = await pool.query(query, values);
        return result.rows;
      }
    }

    if (params.category) {
      conditions.push(`expense_type = $${paramIndex}`);
      values.push(params.category);
      paramIndex++;
    }
    if (params.approval_status) {
      conditions.push(`approval_status = $${paramIndex}`);
      values.push(params.approval_status);
      paramIndex++;
    }
    if (params.startDate) {
      conditions.push(`expense_date >= $${paramIndex}`);
      values.push(params.startDate);
      paramIndex++;
    }
    if (params.endDate) {
      conditions.push(`expense_date <= $${paramIndex}`);
      values.push(params.endDate);
      paramIndex++;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY expense_date DESC';

    const result = await pool.query(query, values);
    return result.rows;
  }

  async findById(id, options) {
    let propertyIds = null;
    if (Array.isArray(options)) propertyIds = options;
    else if (options && options.propertyIds) propertyIds = options.propertyIds;

    let params = [id];
    let where = 'WHERE expenses.id = $1';
    if (propertyIds) {
      const { clause, params: scopeParams } = buildPropertyFilter(propertyIds, 'expenses.property_id', params.length);
      where += clause;
      params = [...params, ...scopeParams];
    }
    const result = await pool.query(`SELECT * FROM expenses ${where}`, params);
    return result.rows[0];
  }

  async create(data, options) {
    if (options && options.propertyIds) {
      const scope = options.propertyIds;
      const pid = data.property_id || data.propertyId;
      if (!scope.includes('*') && pid && !scope.includes(pid)) {
        const err = new Error('Property not in scope');
        err.status = 403;
        throw err;
      }
    }
    const query = `
      INSERT INTO expenses (
        property_id, room_id, expense_date, expense_type, amount,
        provider_name, description, receipt_image_url, reported_by, approval_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    const values = [
      data.property_id || data.propertyId,
      data.room_id || data.roomId || null,
      data.expense_date || data.expenseDate,
      data.expense_type || data.expenseType || data.category,
      data.amount,
      data.provider_name || data.providerName,
      data.description || null,
      data.receipt_image_url || data.receiptImageUrl || null,
      data.reported_by || data.reportedBy,
      data.approval_status || data.approvalStatus || 'pending'
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async update(id, data, options) {
    if (options) {
      const existing = await this.findById(id, options);
      if (!existing) return null;
    }
    const query = `
      UPDATE expenses SET
        property_id = $1, room_id = $2, expense_date = $3, expense_type = $4,
        amount = $5, provider_name = $6, description = $7,
        receipt_image_url = $8, reported_by = $9, approved_by = $10,
        approval_status = $11, updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
      RETURNING *
    `;
    const values = [
      data.property_id || data.propertyId,
      data.room_id || data.roomId,
      data.expense_date || data.expenseDate,
      data.expense_type || data.expenseType || data.category,
      data.amount,
      data.provider_name || data.providerName,
      data.description,
      data.receipt_image_url || data.receiptImageUrl,
      data.reported_by || data.reportedBy,
      data.approved_by || data.approvedBy || null,
      data.approval_status || data.approvalStatus,
      id
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async approve(id, approved_by, options) {
    if (options) {
      const existing = await this.findById(id, options);
      if (!existing) return null;
    }
    const result = await pool.query(
      `UPDATE expenses SET approval_status = 'approved', approved_by = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [approved_by, id]
    );
    return result.rows[0];
  }

  async reject(id, approved_by, options) {
    if (options) {
      const existing = await this.findById(id, options);
      if (!existing) return null;
    }
    const result = await pool.query(
      `UPDATE expenses SET approval_status = 'rejected', approved_by = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [approved_by, id]
    );
    return result.rows[0];
  }

  async delete(id, options) {
    if (options) {
      const existing = await this.findById(id, options);
      if (!existing) return null;
    }
    await pool.query('DELETE FROM expenses WHERE id = $1', [id]);
    return { message: 'Expense deleted' };
  }

  async getTotalByPropertyAndDate(property_id, start_date, end_date, options = {}) {
    let propertyIds = options.propertyIds || null;
    let query = `SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE expense_date BETWEEN $1 AND $2`;
    const params = [start_date, end_date];

    if (property_id) {
      query += ` AND property_id = $${params.length + 1}`;
      params.push(property_id);
    }
    if (propertyIds) {
      const { clause, params: scopeParams } = buildPropertyFilter(propertyIds, 'expenses.property_id', params.length);
      query += clause;
      params.push(...scopeParams);
    }

    const result = await pool.query(query, params);
    return result.rows[0].total;
  }

  async getByCategory(property_id, start_date, end_date, options = {}) {
    let propertyIds = options.propertyIds || null;
    let params = [property_id, start_date, end_date];
    let query = `SELECT expense_type as category, SUM(amount) as amount FROM expenses WHERE property_id = $1 AND expense_date BETWEEN $2 AND $3`;
    
    if (propertyIds) {
      const { clause, params: scopeParams } = buildPropertyFilter(propertyIds, 'expenses.property_id', params.length);
      // If scope doesn't contain property_id, force empty but still handle
      if (clause.includes('1=0')) return [];
      query += clause;
      params = [...params, ...scopeParams];
    }
    query += ` GROUP BY expense_type`;

    // If no property_id provided (dashboard all), handle scope only
    if (!property_id && propertyIds) {
      // Rebuild for scope-only case
      let p2 = [start_date, end_date];
      let q2 = `SELECT expense_type as category, SUM(amount) as amount FROM expenses WHERE expense_date BETWEEN $1 AND $2`;
      const { clause, params: scopeParams } = buildPropertyFilter(propertyIds, 'expenses.property_id', p2.length);
      q2 += clause;
      p2 = [...p2, ...scopeParams];
      q2 += ` GROUP BY expense_type`;
      const r2 = await pool.query(q2, p2);
      return r2.rows;
    }

    const result = await pool.query(query, params);
    return result.rows;
  }
}

module.exports = new ExpenseRepository();
