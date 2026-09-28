// api/repositories/acCleaningRepository.js - Scoped version
const pool = require('../db');
const { buildPropertyFilter } = require('../utils/scope');

class ACCleaningRepository {
  async findAll(statusOrOptions, maybeOptions) {
    let status = null;
    let propertyIds = null;
    let propertyId = null;

    if (typeof statusOrOptions === 'string') {
      status = statusOrOptions;
      if (maybeOptions) {
        propertyIds = maybeOptions.propertyIds || null;
        propertyId = maybeOptions.propertyId || maybeOptions.property_id || null;
      }
    } else if (typeof statusOrOptions === 'object' && statusOrOptions !== null) {
      status = statusOrOptions.status || null;
      propertyIds = statusOrOptions.propertyIds || null;
      propertyId = statusOrOptions.propertyId || statusOrOptions.property_id || null;
    }

    let params = [];
    let where = 'WHERE 1=1';

    if (status) {
      params.push(status);
      where += ` AND ac_cleaning_schedule.status = $${params.length}`;
    }
    if (propertyId) {
      params.push(propertyId);
      where += ` AND ac_cleaning_schedule.property_id = $${params.length}`;
    }
    if (propertyIds) {
      const { clause, params: scopeParams } = buildPropertyFilter(propertyIds, 'ac_cleaning_schedule.property_id', params.length);
      where += clause;
      params = [...params, ...scopeParams];
    }

    const result = await pool.query(`SELECT * FROM ac_cleaning_schedule ${where} ORDER BY next_cleaning_date ASC`, params);
    return result.rows;
  }

  async findById(id, options) {
    let propertyIds = null;
    if (Array.isArray(options)) propertyIds = options;
    else if (options && options.propertyIds) propertyIds = options.propertyIds;

    let params = [id];
    let where = 'WHERE id = $1';
    if (propertyIds) {
      const { clause, params: scopeParams } = buildPropertyFilter(propertyIds, 'ac_cleaning_schedule.property_id', params.length);
      where += clause;
      params = [...params, ...scopeParams];
    }
    const result = await pool.query(`SELECT * FROM ac_cleaning_schedule ${where}`, params);
    return result.rows[0];
  }

  async findByRoomId(room_id, options) {
    let propertyIds = options?.propertyIds || null;
    let params = [room_id];
    let where = 'WHERE room_id = $1';
    if (propertyIds) {
      const { clause, params: scopeParams } = buildPropertyFilter(propertyIds, 'ac_cleaning_schedule.property_id', params.length);
      where += clause;
      params = [...params, ...scopeParams];
    }
    const result = await pool.query(`SELECT * FROM ac_cleaning_schedule ${where} ORDER BY next_cleaning_date DESC`, params);
    return result.rows;
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
      INSERT INTO ac_cleaning_schedule (
        room_id, property_id, ac_unit_id, last_cleaning_date, next_cleaning_date,
        schedule_interval_days, status, cost, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [
      data.room_id || data.roomId,
      data.property_id || data.propertyId,
      data.ac_unit_id || data.acUnitId || null,
      data.last_cleaning_date || data.lastCleaningDate || null,
      data.next_cleaning_date || data.nextCleaningDate,
      data.schedule_interval_days || data.scheduleIntervalDays || 180,
      data.status || 'pending',
      data.cost || 0,
      data.notes || null
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
      UPDATE ac_cleaning_schedule SET
        room_id = $1, property_id = $2, ac_unit_id = $3, last_cleaning_date = $4,
        next_cleaning_date = $5, schedule_interval_days = $6, status = $7,
        completed_date = $8, technician_name = $9, technician_contact = $10,
        cost = $11, notes = $12, completed_by = $13, reminder_sent = $14,
        reminder_sent_at = $15, updated_at = CURRENT_TIMESTAMP
      WHERE id = $16
      RETURNING *
    `;
    const values = [
      data.room_id || data.roomId,
      data.property_id || data.propertyId,
      data.ac_unit_id || data.acUnitId,
      data.last_cleaning_date || data.lastCleaningDate,
      data.next_cleaning_date || data.nextCleaningDate,
      data.schedule_interval_days || data.scheduleIntervalDays,
      data.status,
      data.completed_date || data.completedDate || null,
      data.technician_name || data.technicianName || null,
      data.technician_contact || data.technicianContact || null,
      data.cost,
      data.notes,
      data.completed_by || data.completedBy || null,
      data.reminder_sent || data.reminderSent || false,
      data.reminder_sent_at || data.reminderSentAt || null,
      id
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async complete(id, data, options) {
    if (options) {
      const existing = await this.findById(id, options);
      if (!existing) return null;
    }
    const result = await pool.query(
      `UPDATE ac_cleaning_schedule SET 
        status = 'completed',
        completed_date = COALESCE($1, CURRENT_DATE),
        last_cleaning_date = COALESCE($1, CURRENT_DATE),
        next_cleaning_date = CURRENT_DATE + (schedule_interval_days || ' days')::INTERVAL,
        completed_by = $2,
        cost = $3,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [data.completed_date || data.completedDate || null, data.completed_by || data.completedBy || null, data.cost || 0, id]
    );
    return result.rows[0];
  }

  async sendReminder(id, options) {
    if (options) {
      const existing = await this.findById(id, options);
      if (!existing) return null;
    }
    const result = await pool.query(
      `UPDATE ac_cleaning_schedule SET reminder_sent = true, reminder_sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  }

  async delete(id, options) {
    if (options) {
      const existing = await this.findById(id, options);
      if (!existing) return null;
    }
    await pool.query('DELETE FROM ac_cleaning_schedule WHERE id = $1', [id]);
    return { message: 'AC cleaning schedule deleted' };
  }

  async getOverdue(options = {}) {
    let propertyIds = options.propertyIds || null;
    let params = [];
    let where = `WHERE s.next_cleaning_date < CURRENT_DATE AND s.status = 'pending'`;
    if (propertyIds) {
      const { clause, params: scopeParams } = buildPropertyFilter(propertyIds, 's.property_id', params.length);
      where += clause;
      params = [...params, ...scopeParams];
    }
    const result = await pool.query(
      `SELECT s.*, r.room_number, p.name as property_name
       FROM ac_cleaning_schedule s
       JOIN rooms r ON s.room_id = r.id
       JOIN properties p ON s.property_id = p.id
       ${where}
       ORDER BY s.next_cleaning_date ASC`,
      params
    );
    return result.rows;
  }
}

module.exports = new ACCleaningRepository();
