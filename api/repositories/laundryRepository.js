// api/repositories/laundryRepository.js - Scoped version
const pool = require('../db');
const { buildPropertyFilter } = require('../utils/scope');

class LaundryRepository {
  async findAll(statusOrOptions, maybeOptions) {
    let status = null;
    let propertyIds = null;
    let propertyId = null;
    let tenantId = null;

    if (typeof statusOrOptions === 'string') {
      status = statusOrOptions;
      if (maybeOptions) {
        propertyIds = maybeOptions.propertyIds || null;
        propertyId = maybeOptions.propertyId || maybeOptions.property_id || null;
        tenantId = maybeOptions.tenantId || maybeOptions.tenant_id || null;
      }
    } else if (typeof statusOrOptions === 'object' && statusOrOptions !== null) {
      status = statusOrOptions.status || null;
      propertyIds = statusOrOptions.propertyIds || null;
      propertyId = statusOrOptions.propertyId || statusOrOptions.property_id || null;
      tenantId = statusOrOptions.tenantId || statusOrOptions.tenant_id || null;
    }

    let params = [];
    let where = 'WHERE 1=1';

    if (status) {
      params.push(status);
      where += ` AND laundry_orders.status = $${params.length}`;
    }
    if (tenantId) {
      params.push(tenantId);
      where += ` AND laundry_orders.tenant_id = $${params.length}`;
    }
    if (propertyId) {
      params.push(propertyId);
      where += ` AND laundry_orders.property_id = $${params.length}`;
    }
    if (propertyIds) {
      const { clause, params: scopeParams } = buildPropertyFilter(propertyIds, 'laundry_orders.property_id', params.length);
      where += clause;
      params = [...params, ...scopeParams];
    }

    const result = await pool.query(`SELECT * FROM laundry_orders ${where} ORDER BY order_date DESC`, params);
    return result.rows;
  }

  async findById(id, options) {
    let propertyIds = null;
    if (Array.isArray(options)) propertyIds = options;
    else if (options && options.propertyIds) propertyIds = options.propertyIds;

    let params = [id];
    let where = 'WHERE laundry_orders.id = $1';
    if (propertyIds) {
      const { clause, params: scopeParams } = buildPropertyFilter(propertyIds, 'laundry_orders.property_id', params.length);
      where += clause;
      params = [...params, ...scopeParams];
    }
    const result = await pool.query(`SELECT * FROM laundry_orders ${where}`, params);
    return result.rows[0];
  }

  async findByTenantId(tenantId, options) {
    let propertyIds = options?.propertyIds || null;
    let params = [tenantId];
    let where = 'WHERE tenant_id = $1';
    if (propertyIds) {
      const { clause, params: scopeParams } = buildPropertyFilter(propertyIds, 'laundry_orders.property_id', params.length);
      where += clause;
      params = [...params, ...scopeParams];
    }
    const result = await pool.query(`SELECT * FROM laundry_orders ${where} ORDER BY order_date DESC`, params);
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
      INSERT INTO laundry_orders (
        tenant_id, property_id, room_id, order_date, weight_kg,
        item_count, price_per_kg, service_type, total_price, status, recorded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    const values = [
      data.tenant_id || data.tenantId,
      data.property_id || data.propertyId,
      data.room_id || data.roomId,
      data.order_date || data.orderDate || new Date(),
      data.weight_kg || data.weightKg || null,
      data.item_count || data.itemCount || null,
      data.price_per_kg || data.pricePerKg || 9000,
      data.service_type || data.serviceType || 'wash_and_dry',
      data.total_price || data.totalPrice,
      data.status || 'pending',
      data.recorded_by || data.recordedBy
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async update(id, updates, options) {
    if (options) {
      const existing = await this.findById(id, options);
      if (!existing) return null;
    }
    try {
      const fields = Object.keys(updates).filter(k => k !== 'propertyIds');
      if (fields.length === 0) throw new Error('No fields to update');
      const setClauses = fields.map((field, index) => `${field} = $${index + 1}`).join(', ');
      const values = [...fields.map(field => updates[field]), id];
      const query = `UPDATE laundry_orders SET ${setClauses}, updated_at = CURRENT_TIMESTAMP WHERE id = $${fields.length + 1} RETURNING *`;
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating laundry order:', error);
      throw error;
    }
  }

  async complete(id, completedBy, options) {
    if (options) {
      const existing = await this.findById(id, options);
      if (!existing) return null;
    }
    const result = await pool.query(
      `UPDATE laundry_orders SET status = 'completed', completion_date = CURRENT_DATE, completed_by = $1, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [completedBy, id]
    );
    return result.rows[0];
  }

  async delete(id, options) {
    if (options) {
      const existing = await this.findById(id, options);
      if (!existing) return null;
    }
    await pool.query('DELETE FROM laundry_orders WHERE id = $1', [id]);
    return { message: 'Laundry order deleted' };
  }

  async getRevenueByPeriod(startDate, endDate, options = {}) {
    let propertyIds = options.propertyIds || null;
    let propertyId = options.propertyId || options.property_id || null;
    let params = [startDate, endDate];
    let where = `WHERE status = 'completed' AND order_date BETWEEN $1 AND $2`;
    if (propertyId) {
      params.push(propertyId);
      where += ` AND property_id = $${params.length}`;
    }
    if (propertyIds) {
      const { clause, params: scopeParams } = buildPropertyFilter(propertyIds, 'laundry_orders.property_id', params.length);
      where += clause;
      params = [...params, ...scopeParams];
    }
    const result = await pool.query(`SELECT COALESCE(SUM(total_price), 0) as revenue FROM laundry_orders ${where}`, params);
    return result.rows[0].revenue;
  }
}

module.exports = new LaundryRepository();
