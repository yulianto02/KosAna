// maintenanceRepository.js patch for Step 5 - tukang filtering
// Add support for { assignedTo } option to filter records assigned to a specific user
// Keep existing methods, just add filtering

const pool = require('../db');
const { buildPropertyFilter } = require('../utils/scope'); // if you have this util, else manual

class MaintenanceRepository {
  // Example existing method - update to support assignedTo
  async findAll(filters = {}) {
    const { status, propertyId, propertyIds, assignedTo } = filters;
    const conditions = [];
    const params = [];
    let idx = 1;

    if (status) {
      conditions.push(`m.status = $${idx++}`);
      params.push(status);
    }
    if (propertyId) {
      conditions.push(`m.property_id = $${idx++}`);
      params.push(propertyId);
    }
    if (propertyIds && !propertyIds.includes('*')) {
      conditions.push(`m.property_id = ANY($${idx++})`);
      params.push(propertyIds);
    }
    // Step 5: tukang filtering
    if (assignedTo) {
      conditions.push(`m.assigned_to = $${idx++}`);
      params.push(assignedTo);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `
      SELECT m.*, r.room_number, p.name as property_name, u.full_name as assigned_name
      FROM maintenance_requests m
      LEFT JOIN rooms r ON r.id = m.room_id
      LEFT JOIN properties p ON p.id = m.property_id
      LEFT JOIN users u ON u.id = m.assigned_to
      ${where}
      ORDER BY m.created_at DESC
    `;
    const result = await pool.query(query, params);
    return result.rows;
  }

  async findById(id, filters = {}) {
    const { propertyIds, assignedTo } = filters;
    let query = `
      SELECT m.*, r.room_number, p.name as property_name
      FROM maintenance_requests m
      LEFT JOIN rooms r ON r.id = m.room_id
      LEFT JOIN properties p ON p.id = m.property_id
      WHERE m.id = $1
    `;
    const params = [id];
    let idx = 2;
    if (propertyIds && !propertyIds.includes('*')) {
      query += ` AND m.property_id = ANY($${idx++})`;
      params.push(propertyIds);
    }
    if (assignedTo) {
      query += ` AND m.assigned_to = $${idx++}`;
      params.push(assignedTo);
    }
    const result = await pool.query(query, params);
    return result.rows[0] || null;
  }

  async create(data, scope = {}) {
    // keep your existing create logic, add property check
    const query = `
      INSERT INTO maintenance_requests (room_id, property_id, issue_type, description, priority, status, reported_by, assigned_to, cost)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
    `;
    const values = [
      data.room_id || data.roomId,
      data.property_id || data.propertyId,
      data.issue_type || data.issueType,
      data.description,
      data.priority || 'medium',
      data.status || 'reported',
      data.reported_by || data.reportedBy,
      data.assigned_to || data.assignedTo || null,
      data.cost || 0
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async update(id, data, scope = {}) {
    const allowed = ['status','priority','assigned_to','cost','description','issue_type','resolution_notes'];
    const set = [];
    const vals = [];
    let idx = 1;
    for (const [k,v] of Object.entries(data)) {
      const col = k; // assume snake_case already
      if (allowed.includes(col) && v !== undefined) {
        set.push(`${col} = $${idx++}`);
        vals.push(v);
      }
    }
    if (!set.length) return null;
    vals.push(id);
    let query = `UPDATE maintenance_requests SET ${set.join(', ')}, updated_at = NOW() WHERE id = $${idx}`;
    const params = [...vals];
    if (scope.propertyIds && !scope.propertyIds.includes('*')) {
      query += ` AND property_id = ANY($${++idx})`;
      params.push(scope.propertyIds);
    }
    if (scope.assignedTo) {
      query += ` AND assigned_to = $${++idx}`;
      params.push(scope.assignedTo);
    }
    query += ' RETURNING *';
    const res = await pool.query(query, params);
    return res.rows[0];
  }

  async delete(id, scope = {}) {
    let query = `DELETE FROM maintenance_requests WHERE id = $1`;
    const params = [id];
    if (scope.propertyIds && !scope.propertyIds.includes('*')) {
      query += ` AND property_id = ANY($2)`;
      params.push(scope.propertyIds);
    }
    if (scope.assignedTo) {
      query += ` AND assigned_to = $${params.length+1}`;
      params.push(scope.assignedTo);
    }
    query += ' RETURNING id';
    const res = await pool.query(query, params);
    return res.rows[0];
  }

  async complete(id, data, scope = {}) {
    return this.update(id, { status: 'completed', resolution_notes: data.notes || data.resolution_notes, cost: data.cost }, scope);
  }

  async assign(id, assignedTo, scope = {}) {
    return this.update(id, { assigned_to: assignedTo, status: 'assigned' }, scope);
  }
}

module.exports = new MaintenanceRepository();
