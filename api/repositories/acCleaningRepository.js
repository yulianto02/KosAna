const pool = require('../db');

class ACCleaningRepository {
  async findAll(status) {
    if (status) {
      const result = await pool.query(
        'SELECT * FROM ac_cleaning_schedule WHERE status = $1 ORDER BY next_cleaning_date ASC',
        [status]
      );
      return result.rows;
    }
    const result = await pool.query('SELECT * FROM ac_cleaning_schedule ORDER BY next_cleaning_date ASC');
    return result.rows;
  }

  async findById(id) {
    const result = await pool.query('SELECT * FROM ac_cleaning_schedule WHERE id = $1', [id]);
    return result.rows[0];
  }

  async findByRoomId(room_id) {
    const result = await pool.query(
      'SELECT * FROM ac_cleaning_schedule WHERE room_id = $1 ORDER BY next_cleaning_date DESC',
      [room_id]
    );
    return result.rows;
  }

  async create(data) {
    const query = `
      INSERT INTO ac_cleaning_schedule (
        room_id, property_id, ac_unit_id, last_cleaning_date, next_cleaning_date,
        schedule_interval_days, status, cost, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [
      data.room_id,
      data.property_id,
      data.ac_unit_id || null,
      data.last_cleaning_date || null,
      data.next_cleaning_date,
      data.schedule_interval_days || 180,
      data.status || 'pending',
      data.cost || 0,
      data.notes || null
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async update(id, data) {
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
      data.room_id,
      data.property_id,
      data.ac_unit_id,
      data.last_cleaning_date,
      data.next_cleaning_date,
      data.schedule_interval_days,
      data.status,
      data.completed_date || null,
      data.technician_name || null,
      data.technician_contact || null,
      data.cost,
      data.notes,
      data.completed_by || null,
      data.reminder_sent || false,
      data.reminder_sent_at || null,
      id
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async complete(id, data) {
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
      [data.completed_date || null, data.completed_by || null, data.cost || 0, id]
    );
    return result.rows[0];
  }

  async sendReminder(id) {
    const result = await pool.query(
      `UPDATE ac_cleaning_schedule SET 
        reminder_sent = true,
        reminder_sent_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    return result.rows[0];
  }

  async delete(id) {
    await pool.query('DELETE FROM ac_cleaning_schedule WHERE id = $1', [id]);
    return { message: 'AC cleaning schedule deleted' };
  }

  async getOverdue() {
    const result = await pool.query(
      `SELECT s.*, r.room_number, p.name as property_name
       FROM ac_cleaning_schedule s
       JOIN rooms r ON s.room_id = r.id
       JOIN properties p ON s.property_id = p.id
       WHERE s.next_cleaning_date < CURRENT_DATE AND s.status = 'pending'
       ORDER BY s.next_cleaning_date ASC`
    );
    return result.rows;
  }
}

module.exports = new ACCleaningRepository();