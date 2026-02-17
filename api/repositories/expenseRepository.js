const pool = require('../db');

class ExpenseRepository {
  async findAll(params = {}) {
    let query = 'SELECT * FROM expenses';
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (params.property_id) {
      conditions.push(`property_id = $${paramIndex}`);
      values.push(params.property_id);
      paramIndex++;
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

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY expense_date DESC';

    const result = await pool.query(query, values);
    return result.rows;
  }

  async findById(id) {
    const result = await pool.query('SELECT * FROM expenses WHERE id = $1', [id]);
    return result.rows[0];
  }

  async create(data) {
    const query = `
      INSERT INTO expenses (
        property_id, room_id, expense_date, expense_type, amount,
        provider_name, description, receipt_image_url, reported_by, approval_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    const values = [
      data.property_id,
      data.room_id || null,
      data.expense_date,
      data.expense_type,
      data.amount,
      data.provider_name,
      data.description || null,
      data.receipt_image_url || null,
      data.reported_by,
      data.approval_status || 'pending'
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async update(id, data) {
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
      data.property_id,
      data.room_id,
      data.expense_date,
      data.expense_type,
      data.amount,
      data.provider_name,
      data.description,
      data.receipt_image_url,
      data.reported_by,
      data.approved_by || null,
      data.approval_status,
      id
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async approve(id, approved_by) {
    const result = await pool.query(
      `UPDATE expenses SET 
        approval_status = 'approved', 
        approved_by = $1,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [approved_by, id]
    );
    return result.rows[0];
  }

  async reject(id, approved_by) {
    const result = await pool.query(
      `UPDATE expenses SET 
        approval_status = 'rejected', 
        approved_by = $1,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [approved_by, id]
    );
    return result.rows[0];
  }

  async delete(id) {
    await pool.query('DELETE FROM expenses WHERE id = $1', [id]);
    return { message: 'Expense deleted' };
  }

  async getTotalByPropertyAndDate(property_id, start_date, end_date) {
    let query = `SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE expense_date BETWEEN $1 AND $2`;
    const params = [start_date, end_date];
  
    if (property_id) {
      query += ' AND property_id = $3';
      params.push(property_id);
    }
  
    const result = await pool.query(query, params);
    return result.rows[0].total;
  }

  async getByCategory(property_id, start_date, end_date) {
    const result = await pool.query(
      `SELECT expense_type as category, SUM(amount) as amount
       FROM expenses 
       WHERE property_id = $1 AND expense_date BETWEEN $2 AND $3
       GROUP BY expense_type`,
      [property_id, start_date, end_date]
    );
    return result.rows;
  }
}

module.exports = new ExpenseRepository();