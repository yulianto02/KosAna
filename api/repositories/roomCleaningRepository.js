// api/repositories/roomCleaningRepository.js - Scoped version
const pool = require('../db');
const { buildPropertyFilter } = require('../utils/scope');

class RoomCleaningRepository {
  async findByPropertyAndWeek(propertyId, weekStartDate, options = {}) {
    const propertyIds = options.propertyIds || null;
    if (propertyIds && !propertyIds.includes('*') && !propertyIds.includes(propertyId)) {
      return [];
    }
    const query = `
      SELECT 
        rcs.*,
        r.room_number,
        r.floor,
        p.name as property_name,
        u.username as assigned_username,
        u.full_name as assigned_name,
        cu.full_name as completed_by_name
      FROM room_cleaning_schedule rcs
      JOIN rooms r ON r.id = rcs.room_id
      JOIN properties p ON p.id = rcs.property_id
      LEFT JOIN users u ON u.id = rcs.assigned_to
      LEFT JOIN users cu ON cu.id = rcs.completed_by
      WHERE rcs.property_id = $1 AND rcs.week_start_date = $2
      ORDER BY rcs.day_of_week, rcs.time_slot, r.room_number
    `;
    const result = await pool.query(query, [propertyId, weekStartDate]);
    return result.rows;
  }

  async findById(id, options) {
    const propertyIds = options?.propertyIds || null;
    let params = [id];
    let where = 'WHERE rcs.id = $1';
    if (propertyIds) {
      const { clause, params: scopeParams } = buildPropertyFilter(propertyIds, 'rcs.property_id', params.length);
      where += clause;
      params = [...params, ...scopeParams];
    }
    const query = `
      SELECT 
        rcs.*,
        r.room_number,
        r.floor,
        p.name as property_name,
        u.username as assigned_username,
        u.full_name as assigned_name,
        cu.full_name as completed_by_name
      FROM room_cleaning_schedule rcs
      JOIN rooms r ON r.id = rcs.room_id
      JOIN properties p ON p.id = rcs.property_id
      LEFT JOIN users u ON u.id = rcs.assigned_to
      LEFT JOIN users cu ON cu.id = rcs.completed_by
      ${where}
    `;
    const result = await pool.query(query, params);
    return result.rows[0];
  }

  async findByRoomAndWeek(roomId, weekStartDate, options = {}) {
    // Check room's property via rooms table if scope provided
    let propertyIds = options.propertyIds || null;
    if (propertyIds && !propertyIds.includes('*')) {
      const roomCheck = await pool.query('SELECT property_id FROM rooms WHERE id = $1', [roomId]);
      if (roomCheck.rows.length === 0) return null;
      if (!propertyIds.includes(roomCheck.rows[0].property_id)) return null;
    }
    const query = `
      SELECT rcs.*, r.room_number, u.full_name as assigned_name
      FROM room_cleaning_schedule rcs
      JOIN rooms r ON r.id = rcs.room_id
      LEFT JOIN users u ON u.id = rcs.assigned_to
      WHERE rcs.room_id = $1 AND rcs.week_start_date = $2
    `;
    const result = await pool.query(query, [roomId, weekStartDate]);
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
      INSERT INTO room_cleaning_schedule (
        room_id, property_id, week_start_date, day_of_week, time_slot,
        scheduled_date, status, assigned_to, estimated_duration_minutes, notes, is_recurring
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    const values = [
      data.room_id || data.roomId,
      data.property_id || data.propertyId,
      data.week_start_date || data.weekStartDate,
      data.day_of_week || data.dayOfWeek,
      data.time_slot || data.timeSlot,
      data.scheduled_date || data.scheduledDate,
      data.status || 'scheduled',
      data.assigned_to || data.assignedTo,
      data.estimated_duration_minutes || data.estimatedDurationMinutes || 45,
      data.notes,
      data.is_recurring !== false
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async update(id, updates, options) {
    if (options) {
      const existing = await this.findById(id, options);
      if (!existing) return null;
    }
    const allowedFields = ['day_of_week','time_slot','scheduled_date','status','assigned_to','estimated_duration_minutes','notes','is_recurring'];
    const setClauses = [];
    const values = [];
    let paramCount = 1;
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        setClauses.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }
    if (setClauses.length === 0) return null;
    values.push(id);
    const query = `UPDATE room_cleaning_schedule SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async markInProgress(id, options) {
    if (options) {
      const existing = await this.findById(id, options);
      if (!existing) return null;
    }
    const result = await pool.query(`UPDATE room_cleaning_schedule SET status = 'in_progress', actual_start_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`, [id]);
    return result.rows[0];
  }

  async complete(id, completedBy, notes, actualDuration, options) {
    if (options && options.propertyIds) {
      const existing = await this.findById(id, options);
      if (!existing) return null;
    }
    // Support both (id, completedBy, notes, actualDuration) and (id, completedBy, notes, actualDuration, options) or legacy object
    // Normalize
    if (typeof options === 'undefined' && typeof actualDuration === 'object' && actualDuration?.propertyIds) {
      options = actualDuration;
      actualDuration = undefined;
    }
    const result = await pool.query(
      `UPDATE room_cleaning_schedule SET status = 'completed', completed_by = $2, completed_at = CURRENT_TIMESTAMP, actual_end_time = CURRENT_TIMESTAMP, notes = COALESCE($3, notes), estimated_duration_minutes = COALESCE($4, estimated_duration_minutes) WHERE id = $1 RETURNING *`,
      [id, completedBy, notes, actualDuration]
    );
    return result.rows[0];
  }

  async skip(id, notes, options) {
    if (options) {
      const existing = await this.findById(id, options);
      if (!existing) return null;
    }
    const result = await pool.query(`UPDATE room_cleaning_schedule SET status = 'skipped', notes = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`, [id, notes]);
    return result.rows[0];
  }

  async delete(id, options) {
    if (options) {
      const existing = await this.findById(id, options);
      if (!existing) return null;
    }
    const result = await pool.query('DELETE FROM room_cleaning_schedule WHERE id = $1 RETURNING id', [id]);
    return result.rows[0];
  }

  async getAvailableSlots(propertyId, weekStartDate, options = {}) {
    const propertyIds = options.propertyIds || null;
    if (propertyIds && !propertyIds.includes('*') && !propertyIds.includes(propertyId)) return [];
    const result = await pool.query(`SELECT day_of_week, time_slot, COUNT(*) as count FROM room_cleaning_schedule WHERE property_id = $1 AND week_start_date = $2 GROUP BY day_of_week, time_slot ORDER BY day_of_week, time_slot`, [propertyId, weekStartDate]);
    return result.rows;
  }

  async generateSchedule(propertyId, weekStartDate, options = {}) {
    const propertyIds = options.propertyIds || null;
    if (propertyIds && !propertyIds.includes('*') && !propertyIds.includes(propertyId)) {
      const err = new Error('Property not in scope');
      err.status = 403;
      throw err;
    }
    const result = await pool.query('SELECT generate_weekly_cleaning_schedule($1, $2) as count', [propertyId, weekStartDate]);
    return result.rows[0].count;
  }

  async getRoomHistory(roomId, limit = 10, options = {}) {
    let propertyIds = options.propertyIds || null;
    if (propertyIds && !propertyIds.includes('*')) {
      const roomCheck = await pool.query('SELECT property_id FROM rooms WHERE id = $1', [roomId]);
      if (roomCheck.rows.length === 0) return [];
      if (!propertyIds.includes(roomCheck.rows[0].property_id)) return [];
    }
    const result = await pool.query(`SELECT rcs.*, u.full_name as assigned_name, cu.full_name as completed_by_name FROM room_cleaning_schedule rcs LEFT JOIN users u ON u.id = rcs.assigned_to LEFT JOIN users cu ON cu.id = rcs.completed_by WHERE rcs.room_id = $1 ORDER BY rcs.scheduled_date DESC LIMIT $2`, [roomId, limit]);
    return result.rows;
  }

  async getUpcomingForCleaner(cleanerId, days = 7, options = {}) {
    let propertyIds = options.propertyIds || null;
    let params = [cleanerId];
    let where = `WHERE rcs.assigned_to = $1 AND rcs.scheduled_date >= CURRENT_DATE AND rcs.scheduled_date <= CURRENT_DATE + INTERVAL '${parseInt(days)} days' AND rcs.status IN ('scheduled', 'in_progress')`;
    if (propertyIds) {
      const { clause, params: scopeParams } = buildPropertyFilter(propertyIds, 'rcs.property_id', params.length);
      where += clause;
      params = [...params, ...scopeParams];
    }
    const result = await pool.query(`SELECT rcs.*, r.room_number, p.name as property_name FROM room_cleaning_schedule rcs JOIN rooms r ON r.id = rcs.room_id JOIN properties p ON p.id = rcs.property_id ${where} ORDER BY rcs.scheduled_date, rcs.time_slot`, params);
    return result.rows;
  }

  async getStats(propertyId, weekStartDate, options = {}) {
    const propertyIds = options.propertyIds || null;
    if (propertyIds && !propertyIds.includes('*') && !propertyIds.includes(propertyId)) {
      return { scheduled: 0, in_progress: 0, completed: 0, skipped: 0, total: 0 };
    }
    const result = await pool.query(`SELECT COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled, COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress, COUNT(*) FILTER (WHERE status = 'completed') as completed, COUNT(*) FILTER (WHERE status = 'skipped') as skipped, COUNT(*) as total FROM room_cleaning_schedule WHERE property_id = $1 AND week_start_date = $2`, [propertyId, weekStartDate]);
    return result.rows[0];
  }
}

module.exports = new RoomCleaningRepository();
