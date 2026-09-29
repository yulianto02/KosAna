// api/repositories/roomCleaningRepository.js - FIXED: 0 falsy bug + stats safe + assigned_to null handling
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
    // Guard against route-order bug where id='stats'/'slots' is passed as UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      // If it's not a UUID (e.g. "stats"), don't query - prevents 500 invalid input syntax for type uuid
      if (['stats','slots','generate','room'].includes(id)) {
        return null;
      }
    }
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
    // FIX: Use ?? not || for day_of_week and time_slot because 0 is valid and falsy!
    // Also normalize empty assigned_to ('', 'self') to null to avoid FK error
    let assignedToRaw = data.assigned_to ?? data.assignedTo;
    if (assignedToRaw === '' || assignedToRaw === 'self') assignedToRaw = null;

    const values = [
      data.room_id ?? data.roomId,
      data.property_id ?? data.propertyId,
      data.week_start_date ?? data.weekStartDate,
      data.day_of_week ?? data.dayOfWeek ?? data.day_of_week, // explicit 0 allowed
      data.time_slot ?? data.timeSlot,
      data.scheduled_date ?? data.scheduledDate,
      data.status || 'scheduled',
      assignedToRaw,
      data.estimated_duration_minutes ?? data.estimatedDurationMinutes ?? 45,
      data.notes ?? null,
      data.is_recurring !== false
    ];

    // Ensure day_of_week and time_slot are numbers (0 allowed)
    values[3] = values[3] !== undefined && values[3] !== null ? parseInt(values[3]) : values[3];
    values[4] = values[4] !== undefined && values[4] !== null ? parseInt(values[4]) : values[4];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async update(id, updates, options) {
    if (options) {
      const existing = await this.findById(id, options);
      if (!existing) return null;
    }
    // Normalize assigned_to empty to null
    if (updates.assigned_to === '' || updates.assigned_to === 'self') updates.assigned_to = null;

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
    try {
      const result = await pool.query('SELECT generate_weekly_cleaning_schedule($1, $2) as count', [propertyId, weekStartDate]);
      return result.rows[0].count;
    } catch (e) {
      if (e.message && e.message.includes('does not exist')) {
        console.warn('generate_weekly_cleaning_schedule() not found, returning 0');
        return 0;
      }
      throw e;
    }
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
    try {
      const result = await pool.query(`
        SELECT 
          COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled,
          COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
          COUNT(*) FILTER (WHERE status = 'completed') as completed,
          COUNT(*) FILTER (WHERE status = 'skipped') as skipped,
          COUNT(*) as total
        FROM room_cleaning_schedule 
        WHERE property_id = $1 AND week_start_date = $2
      `, [propertyId, weekStartDate]);
      const row = result.rows[0];
      return {
        scheduled: parseInt(row.scheduled) || 0,
        in_progress: parseInt(row.in_progress) || 0,
        completed: parseInt(row.completed) || 0,
        skipped: parseInt(row.skipped) || 0,
        total: parseInt(row.total) || 0
      };
    } catch (e) {
      console.error('getStats FILTER failed, fallback to CASE WHEN', e.message);
      const result = await pool.query(`
        SELECT 
          SUM(CASE WHEN status='scheduled' THEN 1 ELSE 0 END) as scheduled,
          SUM(CASE WHEN status='in_progress' THEN 1 ELSE 0 END) as in_progress,
          SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN status='skipped' THEN 1 ELSE 0 END) as skipped,
          COUNT(*) as total
        FROM room_cleaning_schedule 
        WHERE property_id = $1 AND week_start_date = $2
      `, [propertyId, weekStartDate]);
      const row = result.rows[0];
      return {
        scheduled: parseInt(row.scheduled) || 0,
        in_progress: parseInt(row.in_progress) || 0,
        completed: parseInt(row.completed) || 0,
        skipped: parseInt(row.skipped) || 0,
        total: parseInt(row.total) || 0
      };
    }
  }
}

module.exports = new RoomCleaningRepository();
