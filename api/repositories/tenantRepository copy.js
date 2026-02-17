const pool = require('../db');

class TenantRepository {
  async findAll(status) {
    if (status) {
      const result = await pool.query(
        'SELECT * FROM tenants WHERE status = $1 ORDER BY created_at DESC',
        [status]
      );
      return result.rows;
    }
    const result = await pool.query('SELECT * FROM tenants ORDER BY created_at DESC');
    return result.rows;
  }

  async findById(id) {
    const result = await pool.query('SELECT * FROM tenants WHERE id = $1', [id]);
    return result.rows[0];
  }

  async findByRoomId(roomId) {
    const result = await pool.query(
      'SELECT * FROM tenants WHERE room_id = $1 AND status = $2',
      [roomId, 'active']
    );
    return result.rows[0];
  }

  async findByPropertyId(propertyId, status) {
    if (status) {
      const result = await pool.query(
        'SELECT * FROM tenants WHERE property_id = $1 AND status = $2 ORDER BY created_at DESC',
        [propertyId, status]
      );
      return result.rows;
    }
    const result = await pool.query(
      'SELECT * FROM tenants WHERE property_id = $1 ORDER BY created_at DESC',
      [propertyId]
    );
    return result.rows;
  }

  async create(data) {
    const query = `
      INSERT INTO tenants (
        user_id, property_id, room_id, full_name, phone, email,
        emergency_contact, emergency_phone, ktp_number, ktp_image_url,
        check_in_date, contract_duration_months, base_monthly_rent,
        additional_person_fee, total_monthly_rent, security_deposit,
        late_fee_percentage, payment_due_day, is_shared_room,
        secondary_tenant_name, secondary_tenant_phone, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *
    `;
    // Accept both snake_case (from frontend) and camelCase (backward compatibility)
    const values = [
      data.user_id || data.userId || null,
      data.property_id || data.propertyId,
      data.room_id || data.roomId,
      data.full_name || data.fullName,
      data.phone,
      data.email || null,
      data.emergency_contact || data.emergencyContact,
      data.emergency_phone || data.emergencyPhone,
      data.ktp_number || data.ktpNumber,
      data.ktp_image_url || data.ktpImageUrl || null,
      data.check_in_date || data.checkInDate,
      data.contract_duration_months || data.contractDurationMonths,
      data.base_monthly_rent || data.baseMonthlyRent,
      data.additional_person_fee || data.additionalPersonFee || 0,
      data.total_monthly_rent || data.totalMonthlyRent,
      data.security_deposit || data.securityDeposit,
      data.late_fee_percentage || data.lateFeePercentage || 5.00,
      data.payment_due_day || data.paymentDueDay || 1,
      data.is_shared_room || data.isSharedRoom || false,
      data.secondary_tenant_name || data.secondaryTenantName || null,
      data.secondary_tenant_phone || data.secondaryTenantPhone || null,
      data.status || 'active'
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async update(id, data) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Build dynamic SET clause only for provided fields
      const setClauses = [];
      const values = [];
      let paramIndex = 1;
      
      // Map of allowed fields to prevent SQL injection via column names
      const allowedFields = [
        'user_id', 'property_id', 'room_id', 'full_name', 'phone', 'email',
        'emergency_contact', 'emergency_phone', 'ktp_number', 'ktp_image_url',
        'check_in_date', 'check_out_date', 'contract_duration_months',
        'base_monthly_rent', 'additional_person_fee', 'total_monthly_rent',
        'security_deposit', 'late_fee_percentage', 'payment_due_day',
        'contract_file_url', 'tenant_signature_url', 'admin_signature_url',
        'is_shared_room', 'secondary_tenant_name', 'secondary_tenant_phone',
        'status', 'move_out_reason', 'final_settlement_amount', 'archived_at'
      ];
      
      // Build dynamic query for provided fields only
      for (const [key, value] of Object.entries(data)) {
        if (allowedFields.includes(key) && value !== undefined) {
          setClauses.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }
      
      // Always update updated_at timestamp
      setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
      
      if (setClauses.length === 0) {
        throw new Error('No valid fields provided for update');
      }
      
      // Add id as last parameter
      values.push(id);
      
      const query = `
        UPDATE tenants 
        SET ${setClauses.join(', ')} 
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('Tenant not found');
      }
      
      await client.query('COMMIT');
      return result.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating tenant:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async updateStatus(id, status) {
    const result = await pool.query(
      `UPDATE tenants SET status = $1, 
       ${status === 'archived' ? 'archived_at = CURRENT_TIMESTAMP,' : ''}
       updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 RETURNING *`,
      [status, id]
    );
    return result.rows[0];
  }

  async delete(id) {
    await pool.query('DELETE FROM tenants WHERE id = $1', [id]);
    return { message: 'Tenant deleted' };
  }

  async getActiveTenantsByProperty(propertyId) {
    const result = await pool.query(
      `SELECT t.*, r.room_number 
       FROM tenants t
       JOIN rooms r ON t.room_id = r.id
       WHERE t.property_id = $1 AND t.status = 'active'
       ORDER BY r.room_number`,
      [propertyId]
    );
    return result.rows;
  }
}

module.exports = new TenantRepository();