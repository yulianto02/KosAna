// api/repositories/maintenanceRepository.js - Scoped, adapted to your existing schema
const pool = require('../db');
const { buildPropertyFilter } = require('../utils/scope');

class MaintenanceRepository {
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
      where += ` AND maintenance_requests.status = $${params.length}`;
    }
    if (propertyId) {
      params.push(propertyId);
      where += ` AND maintenance_requests.property_id = $${params.length}`;
    }
    if (propertyIds) {
      const { clause, params: scopeParams } = buildPropertyFilter(propertyIds, 'maintenance_requests.property_id', params.length);
      where += clause;
      params = [...params, ...scopeParams];
    }

    const result = await pool.query(`SELECT * FROM maintenance_requests ${where} ORDER BY request_date DESC`, params);
    return result.rows;
  }

  async findById(id, options) {
    let propertyIds = null;
    if (Array.isArray(options)) propertyIds = options;
    else if (options && options.propertyIds) propertyIds = options.propertyIds;

    let params = [id];
    let where = 'WHERE id = $1';
    if (propertyIds) {
      const { clause, params: scopeParams } = buildPropertyFilter(propertyIds, 'maintenance_requests.property_id', params.length);
      where += clause;
      params = [...params, ...scopeParams];
    }
    const result = await pool.query(`SELECT * FROM maintenance_requests ${where}`, params);
    return result.rows[0];
  }

  async findByRoomId(roomId, options) {
    let propertyIds = options?.propertyIds || null;
    let params = [roomId];
    let where = 'WHERE room_id = $1';
    if (propertyIds) {
      const { clause, params: scopeParams } = buildPropertyFilter(propertyIds, 'maintenance_requests.property_id', params.length);
      where += clause;
      params = [...params, ...scopeParams];
    }
    const result = await pool.query(`SELECT * FROM maintenance_requests ${where} ORDER BY request_date DESC`, params);
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
      INSERT INTO maintenance_requests (
        tenant_id, room_id, property_id, request_date, issue_type,
        description, priority, status, cost, photos, technician_name, technician_contact, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    const values = [
      data.tenant_id || data.tenantId || null,
      data.room_id || data.roomId,
      data.property_id || data.propertyId,
      data.request_date || data.requestDate,
      data.issue_type || data.issueType,
      data.description,
      data.priority || 'medium',
      data.status || 'reported',
      data.cost || 0,
      data.photos ? JSON.stringify(data.photos) : null,
      data.technician_name || data.technicianName || null,
      data.technician_contact || data.technicianContact || null,
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
      data.tenant_id || data.tenantId || null,
      data.room_id || data.roomId,
      data.property_id || data.propertyId,
      data.request_date || data.requestDate,
      data.issue_type || data.issueType,
      data.description,
      data.priority,
      data.status,
      data.assigned_to || data.assignedTo || null,
      data.estimated_completion || data.estimatedCompletion || null,
      data.actual_completion || data.actualCompletion || null,
      data.cost || 0,
      data.photos ? JSON.stringify(data.photos) : null,
      data.technician_name || data.technicianName || null,
      data.technician_contact || data.technicianContact || null,
      data.notes || null,
      id
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async assign(id, assignedTo, options) {
    if (options) {
      const existing = await this.findById(id, options);
      if (!existing) return null;
    }
    const result = await pool.query(
      `UPDATE maintenance_requests SET assigned_to = $1, status = 'in_progress', updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [assignedTo, id]
    );
    return result.rows[0];
  }

  async complete(id, data, options) {
    if (options) {
      const existing = await this.findById(id, options);
      if (!existing) return null;
    }
    const result = await pool.query(
      `UPDATE maintenance_requests SET status = 'completed', actual_completion = COALESCE($1, CURRENT_DATE), cost = COALESCE($2, cost, 0), updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *`,
      [data.actual_completion || data.actualCompletion || null, data.cost || 0, id]
    );
    return result.rows[0];
  }

  async delete(id, options) {
    if (options) {
      const existing = await this.findById(id, options);
      if (!existing) return null;
    }
    await pool.query('DELETE FROM maintenance_requests WHERE id = $1', [id]);
    return { message: 'Maintenance request deleted' };
  }

  async getPendingByProperty(propertyId, options) {
    if (options && options.propertyIds) {
      const scope = options.propertyIds;
      if (!scope.includes('*') && !scope.includes(propertyId)) return [];
    }
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
