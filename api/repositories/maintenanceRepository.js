const pool = require('../db');

class MaintenanceRepository {
  async findAll(status) {
    if (status) {
      const result = await pool.query(
        'SELECT * FROM maintenance_requests WHERE status = $1 ORDER BY request_date DESC',
        [status]
      );
      return result.rows;
    }
    const result = await pool.query('SELECT * FROM maintenance_requests ORDER BY request_date DESC');
    return result.rows;
  }

  async findById(id) {
    const result = await pool.query('SELECT * FROM maintenance_requests WHERE id = $1', [id]);
    return result.rows[0];
  }

  async findByRoomId(roomId) {
    const result = await pool.query(
      'SELECT * FROM maintenance_requests WHERE room_id = $1 ORDER BY request_date DESC',
      [roomId]
    );
    return result.rows;
  }

  async create(data) {
    // FIXED: Now expects snake_case keys from frontend to match PostgreSQL columns
    const query = `
      INSERT INTO maintenance_requests (
        tenant_id, room_id, property_id, request_date, issue_type,
        description, priority, status, cost, photos, technician_name, technician_contact, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    const values = [
      data.tenant_id || null,        // FIXED: was data.tenantId
      data.room_id,                   // FIXED: was data.roomId
      data.property_id,               // FIXED: was data.propertyId
      data.request_date,              // FIXED: was data.requestDate
      data.issue_type,                // FIXED: was data.issueType
      data.description,
      data.priority || 'medium',
      data.status || 'reported',
      data.cost || 0,
      data.photos ? JSON.stringify(data.photos) : null,
      data.technician_name || null,   // FIXED: was data.technicianName
      data.technician_contact || null, // FIXED: was data.technicianContact
      data.notes || null
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async update(id, data) {
    // FIXED: Now expects snake_case keys
    const query = `
      UPDATE maintenance_requests SET
        tenant_id = $1, room_id = $2, property_id = $3, request_date = $4,
        issue_type = $5, description = $6, priority = $7, status = $8,
        assigned_to = $9, estimated_completion = $10, actual_completion = $11,
        cost = $12, photos = $13, technician_name = $14, technician_contact = $15,
        notes = $16, updated_at = CURRENT_TIMESTAMP
      WHERE id = $17
      RETURNING *
    `;
    const values = [
      data.tenant_id || null,           // FIXED: was data.tenantId
      data.room_id,                      // FIXED: was data.roomId
      data.property_id,                  // FIXED: was data.propertyId
      data.request_date,                 // FIXED: was data.requestDate
      data.issue_type,                   // FIXED: was data.issueType
      data.description,
      data.priority,
      data.status,
      data.assigned_to || null,          // FIXED: was data.assignedTo
      data.estimated_completion || null, // FIXED: was data.estimatedCompletion
      data.actual_completion || null,    // FIXED: was data.actualCompletion
      data.cost || 0,
      data.photos ? JSON.stringify(data.photos) : null,
      data.technician_name || null,    // FIXED: was data.technicianName
      data.technician_contact || null, // FIXED: was data.technicianContact
      data.notes || null,
      id
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async assign(id, assignedTo) {
    // FIXED: parameter name consistency
    const result = await pool.query(
      `UPDATE maintenance_requests SET 
        assigned_to = $1,
        status = 'in_progress',
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [assignedTo, id]
    );
    return result.rows[0];
  }

  async complete(id, data) {
    // FIXED: expects snake_case keys from frontend
    const result = await pool.query(
      `UPDATE maintenance_requests SET 
        status = 'completed',
        actual_completion = COALESCE($1, CURRENT_DATE),
        cost = COALESCE($2, cost, 0),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [
        data.actual_completion || null, // FIXED: was data.actualCompletion
        data.cost || 0,
        id
      ]
    );
    return result.rows[0];
  }

  async delete(id) {
    await pool.query('DELETE FROM maintenance_requests WHERE id = $1', [id]);
    return { message: 'Maintenance request deleted' };
  }

  async getPendingByProperty(propertyId) {
    const result = await pool.query(
      `SELECT m.*, r.room_number, t.full_name as tenant_name
       FROM maintenance_requests m
       JOIN rooms r ON m.room_id = r.id
       LEFT JOIN tenants t ON m.tenant_id = t.id
       WHERE m.property_id = $1 AND m.status != 'completed'
       ORDER BY m.priority DESC, m.request_date ASC`,
      [propertyId]
    );
    return result.rows;
  }
}

module.exports = new MaintenanceRepository();