// api/repositories/maintenanceRepository.js - FINAL FIX for your actual \d schema
// Matches: maintenance_requests(id, tenant_id, room_id, property_id, request_date, issue_type, description, priority, status, assigned_to, estimated_completion, actual_completion, cost, photos, technician_name, technician_contact, notes)
// Keeps Step 5 tukang filtering: scope = { propertyIds, assignedTo }

const pool = require('../db');

class MaintenanceRepository {
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
      ORDER BY m.request_date DESC, m.created_at DESC
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
    // data from Maintenance.tsx: property_id, room_id, issue_type, priority, description, technician_name, cost, notes, request_date, status
    // + optional tenant_id, assigned_to, etc
    const property_id = data.property_id || data.propertyId;
    const room_id = data.room_id || data.roomId;
    const issue_type = data.issue_type || data.issueType;
    const description = data.description;
    const priority = data.priority || 'medium';
    const status = data.status || 'reported';
    const request_date = data.request_date || data.requestDate || new Date().toISOString().split('T')[0];
    const technician_name = data.technician_name || data.technicianName || null;
    const technician_contact = data.technician_contact || data.technicianContact || null;
    const cost = data.cost ?? data.estimatedCost ?? 0;
    const notes = data.notes || null;
    let tenant_id = data.tenant_id || data.tenantId || null;
    const assigned_to = data.assigned_to || data.assignedTo || null;
    const estimated_completion = data.estimated_completion || data.estimatedCompletion || null;
    const actual_completion = data.actual_completion || data.actualCompletion || null;
    const photos = data.photos || null;

    if (!property_id || !room_id || !issue_type || !description) {
      throw Object.assign(new Error('property_id, room_id, issue_type, description required'), { status: 400 });
    }

    // Scope check for penjaga
    if (scope.propertyIds && !scope.propertyIds.includes('*') && !scope.propertyIds.includes(property_id)) {
      throw Object.assign(new Error('Property not in scope'), { status: 404 });
    }

    // Auto-fill tenant_id if not provided - find active tenant in that room
    if (!tenant_id) {
      try {
        const tr = await pool.query(`SELECT id FROM tenants WHERE room_id = $1 AND status = 'active' LIMIT 1`, [room_id]);
        if (tr.rows.length) tenant_id = tr.rows[0].id;
      } catch (e) { /* ignore, leave null */ }
    }

    const query = `
      INSERT INTO maintenance_requests
        (id, tenant_id, room_id, property_id, request_date, issue_type, description, priority, status, assigned_to, estimated_completion, actual_completion, cost, photos, technician_name, technician_contact, notes)
      VALUES
        (gen_random_uuid(), $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING *
    `;
    const values = [
      tenant_id,
      room_id,
      property_id,
      request_date,
      issue_type,
      description,
      priority,
      status,
      assigned_to,
      estimated_completion,
      actual_completion,
      cost,
      photos ? JSON.stringify(photos) : null,
      technician_name,
      technician_contact,
      notes
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async update(id, data, scope = {}) {
    // allowlist to exact columns in your table
    const allowed = ['tenant_id','room_id','property_id','request_date','issue_type','description','priority','status','assigned_to','estimated_completion','actual_completion','cost','photos','technician_name','technician_contact','notes'];
    const set = [];
    const vals = [];
    let idx = 1;

    for (const [k, v] of Object.entries(data)) {
      // normalize camelCase to snake_case
      const col = k.replace(/[A-Z]/g, m => '_' + m.toLowerCase());
      if (allowed.includes(col) && v !== undefined) {
        set.push(`${col} = $${idx++}`);
        vals.push(col === 'photos' && v ? JSON.stringify(v) : v);
      }
    }
    if (!set.length) {
      // if nothing valid, try to find and return
      return this.findById(id, scope);
    }
    vals.push(id);
    let query = `UPDATE maintenance_requests SET ${set.join(', ')}, updated_at = NOW() WHERE id = $${idx}`;
    const params = [...vals];
    let pIdx = idx + 1;

    if (scope.propertyIds && !scope.propertyIds.includes('*')) {
      query += ` AND property_id = ANY($${pIdx++})`;
      params.push(scope.propertyIds);
    }
    if (scope.assignedTo) {
      query += ` AND assigned_to = $${pIdx++}`;
      params.push(scope.assignedTo);
    }
    query += ' RETURNING *';
    const res = await pool.query(query, params);
    return res.rows[0] || null;
  }

  async delete(id, scope = {}) {
    let query = `DELETE FROM maintenance_requests WHERE id = $1`;
    const params = [id];
    if (scope.propertyIds && !scope.propertyIds.includes('*')) {
      query += ` AND property_id = ANY($2)`;
      params.push(scope.propertyIds);
    }
    if (scope.assignedTo) {
      query += ` AND assigned_to = $${params.length + 1}`;
      params.push(scope.assignedTo);
    }
    query += ' RETURNING id';
    const res = await pool.query(query, params);
    return res.rows[0] || null;
  }

  async complete(id, data, scope = {}) {
    // data: { actual_completion, cost, notes }
    const existing = await this.findById(id, scope);
    if (!existing) return null;
    const actual_completion = data.actual_completion || data.actualCompletion || new Date().toISOString().split('T')[0];
    const cost = data.cost ?? existing.cost;
    const notes = data.notes ?? existing.notes;
    const query = `UPDATE maintenance_requests SET status = 'completed', actual_completion = $1, cost = $2, notes = COALESCE($3, notes), updated_at = NOW() WHERE id = $4 RETURNING *`;
    const res = await pool.query(query, [actual_completion, cost, notes, id]);
    return res.rows[0];
  }

  async assign(id, assignedTo, scope = {}) {
    // Step 5: tukang assign
    return this.update(id, { assigned_to: assignedTo, status: 'in_progress' }, scope);
  }
}

module.exports = new MaintenanceRepository();
