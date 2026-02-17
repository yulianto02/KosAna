const pool = require('../db');

class LaundryRepository {
  async findAll(status) {
    if (status) {
      const result = await pool.query(
        'SELECT * FROM laundry_orders WHERE status = $1 ORDER BY order_date DESC',
        [status]
      );
      return result.rows;
    }
    const result = await pool.query('SELECT * FROM laundry_orders ORDER BY order_date DESC');
    return result.rows;
  }

  async findById(id) {
    const result = await pool.query('SELECT * FROM laundry_orders WHERE id = $1', [id]);
    return result.rows[0];
  }

  async findByTenantId(tenantId) {
    const result = await pool.query(
      'SELECT * FROM laundry_orders WHERE tenant_id = $1 ORDER BY order_date DESC',
      [tenantId]
    );
    return result.rows;
  }

  async create(data) {
    // data now comes with snake_case properties from frontend
    const query = `
      INSERT INTO laundry_orders (
        tenant_id, property_id, room_id, order_date, weight_kg,
        item_count, price_per_kg, service_type, total_price, status, recorded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    const values = [
      data.tenant_id,        // Changed from data.tenantId
      data.property_id,      // Changed from data.propertyId
      data.room_id,          // Changed from data.roomId
      data.order_date || new Date(),  // Changed from data.orderDate
      data.weight_kg || null,         // Changed from data.weightKg
      data.item_count || null,        // Changed from data.itemCount
      data.price_per_kg || 9000,      // Changed from data.pricePerKg
      data.service_type || 'wash_and_dry',  // Changed from data.serviceType
      data.total_price,      // Changed from data.totalPrice
      data.status || 'pending',
      data.recorded_by       // Changed from data.recordedBy
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // ========================================================================
  // 🔧 FIXED: Partial Update Method
  // ========================================================================
  // ❌ OLD PROBLEM: Full row replacement caused NULL violations
  //    When sending { status: 'in_progress' }, all other fields became NULL
  //
  // ✅ NEW SOLUTION: Only update fields that are provided in the 'updates' object
  //    Other fields remain unchanged in the database
  // ========================================================================
  async update(id, updates) {
    try {
      // Get only the fields that are provided (not undefined)
      const fields = Object.keys(updates);
      
      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      // Build SET clause dynamically: field1 = $1, field2 = $2, ...
      const setClauses = fields.map((field, index) => 
        `${field} = $${index + 1}`
      ).join(', ');

      // Values array: [updates.field1, updates.field2, ..., id]
      const values = [...fields.map(field => updates[field]), id];

      // Construct query with dynamic SET clause
      const query = `
        UPDATE laundry_orders 
        SET ${setClauses}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${fields.length + 1}
        RETURNING *
      `;

      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating laundry order:', error);
      throw error;
    }
  }

  async complete(id, completedBy) {
    const result = await pool.query(
      `UPDATE laundry_orders SET 
        status = 'completed',
        completion_date = CURRENT_DATE,
        completed_by = $1,
        completed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [completedBy, id]
    );
    return result.rows[0];
  }

  async delete(id) {
    await pool.query('DELETE FROM laundry_orders WHERE id = $1', [id]);
    return { message: 'Laundry order deleted' };
  }

  async getRevenueByPeriod(startDate, endDate) {
    const result = await pool.query(
      `SELECT COALESCE(SUM(total_price), 0) as revenue
       FROM laundry_orders 
       WHERE status = 'completed' AND order_date BETWEEN $1 AND $2`,
      [startDate, endDate]
    );
    return result.rows[0].revenue;
  }
}

module.exports = new LaundryRepository();