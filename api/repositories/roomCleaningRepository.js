const pool = require('../db');

class RoomCleaningRepository {
  // Find all cleaning schedules for a property and week
  async findByPropertyAndWeek(propertyId, weekStartDate) {
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

  // Find schedule by ID with details
  async findById(id) {
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
      WHERE rcs.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Find schedule by room and week
  async findByRoomAndWeek(roomId, weekStartDate) {
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

  // Create new schedule
  async create(data) {
    const query = `
      INSERT INTO room_cleaning_schedule (
        room_id, property_id, week_start_date, day_of_week, time_slot,
        scheduled_date, status, assigned_to, estimated_duration_minutes, notes, is_recurring
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    const values = [
      data.room_id,
      data.property_id,
      data.week_start_date,
      data.day_of_week,
      data.time_slot,
      data.scheduled_date,
      data.status || 'scheduled',
      data.assigned_to,
      data.estimated_duration_minutes || 45,
      data.notes,
      data.is_recurring !== false
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Update schedule
  async update(id, updates) {
    const allowedFields = [
      'day_of_week', 'time_slot', 'scheduled_date', 'status',
      'assigned_to', 'estimated_duration_minutes', 'notes', 'is_recurring'
    ];
    
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
    const query = `
      UPDATE room_cleaning_schedule 
      SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $${paramCount} 
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Mark as in progress
  async markInProgress(id) {
    const query = `
      UPDATE room_cleaning_schedule 
      SET status = 'in_progress', actual_start_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Complete schedule
  async complete(id, completedBy, notes, actualDuration) {
    const query = `
      UPDATE room_cleaning_schedule 
      SET 
        status = 'completed', 
        completed_by = $2, 
        completed_at = CURRENT_TIMESTAMP,
        actual_end_time = CURRENT_TIMESTAMP,
        notes = COALESCE($3, notes),
        estimated_duration_minutes = COALESCE($4, estimated_duration_minutes)
      WHERE id = $1 
      RETURNING *
    `;
    const result = await pool.query(query, [id, completedBy, notes, actualDuration]);
    return result.rows[0];
  }

  // Skip schedule with reason
  async skip(id, notes) {
    const query = `
      UPDATE room_cleaning_schedule 
      SET status = 'skipped', notes = $2, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING *
    `;
    const result = await pool.query(query, [id, notes]);
    return result.rows[0];
  }

  // Delete schedule
  async delete(id) {
    const query = 'DELETE FROM room_cleaning_schedule WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Get available slots for a property and week
  async getAvailableSlots(propertyId, weekStartDate) {
    const query = `
      SELECT day_of_week, time_slot, COUNT(*) as count
      FROM room_cleaning_schedule
      WHERE property_id = $1 AND week_start_date = $2
      GROUP BY day_of_week, time_slot
      ORDER BY day_of_week, time_slot
    `;
    const result = await pool.query(query, [propertyId, weekStartDate]);
    return result.rows;
  }

  // Auto-generate schedule for a week
  async generateSchedule(propertyId, weekStartDate) {
    const query = 'SELECT generate_weekly_cleaning_schedule($1, $2) as count';
    const result = await pool.query(query, [propertyId, weekStartDate]);
    return result.rows[0].count;
  }

  // Get cleaning history for a room
  async getRoomHistory(roomId, limit = 10) {
    const query = `
      SELECT 
        rcs.*,
        u.full_name as assigned_name,
        cu.full_name as completed_by_name
      FROM room_cleaning_schedule rcs
      LEFT JOIN users u ON u.id = rcs.assigned_to
      LEFT JOIN users cu ON cu.id = rcs.completed_by
      WHERE rcs.room_id = $1
      ORDER BY rcs.scheduled_date DESC
      LIMIT $2
    `;
    const result = await pool.query(query, [roomId, limit]);
    return result.rows;
  }

  // Get upcoming cleanings for a penjaga
  async getUpcomingForCleaner(cleanerId, days = 7) {
    const query = `
      SELECT 
        rcs.*,
        r.room_number,
        p.name as property_name
      FROM room_cleaning_schedule rcs
      JOIN rooms r ON r.id = rcs.room_id
      JOIN properties p ON p.id = rcs.property_id
      WHERE rcs.assigned_to = $1 
      AND rcs.scheduled_date >= CURRENT_DATE
      AND rcs.scheduled_date <= CURRENT_DATE + INTERVAL '${days} days'
      AND rcs.status IN ('scheduled', 'in_progress')
      ORDER BY rcs.scheduled_date, rcs.time_slot
    `;
    const result = await pool.query(query, [cleanerId]);
    return result.rows;
  }

  // Get statistics for dashboard
  async getStats(propertyId, weekStartDate) {
    const query = `
      SELECT 
        COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'skipped') as skipped,
        COUNT(*) as total
      FROM room_cleaning_schedule
      WHERE property_id = $1 AND week_start_date = $2
    `;
    const result = await pool.query(query, [propertyId, weekStartDate]);
    return result.rows[0];
  }
}

module.exports = new RoomCleaningRepository();