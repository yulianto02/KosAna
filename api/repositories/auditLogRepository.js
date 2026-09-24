const pool = require('../db');

class AuditLogRepository {
  async create(data) {
    const query = `
      INSERT INTO audit_logs (user_id, action, table_name, record_id, new_data, details)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      data.user_id,
      data.action,
      data.table_name,
      data.record_id,
      data.new_data ? JSON.stringify(data.new_data) : null,
      data.details ? JSON.stringify(data.details) : null
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }
}

module.exports = new AuditLogRepository();