// api/repositories/tenantRepository.js - Scoped, adapted to your existing implementation
const pool = require('../db');
const { buildPropertyFilter } = require('../utils/scope');

class TenantRepository {
  async findAll(statusOrOptions, maybeOptions) {
    let status = null;
    let propertyIds = null;
    let propertyId = null;

    // Legacy: findAll('active') | New: findAll({ status, propertyId, propertyIds })
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
      where += ` AND tenants.status = $${params.length}`;
    }
    if (propertyId) {
      params.push(propertyId);
      where += ` AND tenants.property_id = $${params.length}`;
    }
    if (propertyIds) {
      const { clause, params: scopeParams } = buildPropertyFilter(propertyIds, 'tenants.property_id', params.length);
      where += clause;
      params = [...params, ...scopeParams];
    }

    const result = await pool.query(`SELECT * FROM tenants ${where} ORDER BY created_at DESC`, params);
    return result.rows;
  }

  async findById(id, options) {
    let propertyIds = null;
    if (Array.isArray(options)) propertyIds = options;
    else if (options && options.propertyIds) propertyIds = options.propertyIds;

    let params = [id];
    let where = 'WHERE tenants.id = $1';
    if (propertyIds) {
      const { clause, params: scopeParams } = buildPropertyFilter(propertyIds, 'tenants.property_id', params.length);
      where += clause;
      params = [...params, ...scopeParams];
    }

    const result = await pool.query(`SELECT * FROM tenants ${where}`, params);
    return result.rows[0];
  }

  async findByRoomId(roomId, options) {
    // Scope via room's property if needed
    let propertyIds = options?.propertyIds || null;
    let params = [roomId, 'active'];
    let where = 'WHERE tenants.room_id = $1 AND tenants.status = $2';
    if (propertyIds) {
      const { clause, params: scopeParams } = buildPropertyFilter(propertyIds, 'tenants.property_id', params.length);
      where += clause;
      params = [...params, ...scopeParams];
    }
    const result = await pool.query(`SELECT * FROM tenants ${where}`, params);
    return result.rows[0];
  }

  async findByPropertyId(propertyId, statusOrOptions, maybeOptions) {
    let status = null;
    let propertyIds = null;

    if (typeof statusOrOptions === 'string') {
      status = statusOrOptions;
      propertyIds = maybeOptions?.propertyIds || null;
    } else if (typeof statusOrOptions === 'object' && statusOrOptions !== null) {
      status = statusOrOptions.status || null;
      propertyIds = statusOrOptions.propertyIds || null;
    }

    // If single propertyId not in scope, return empty
    if (propertyIds && !propertyIds.includes('*') && !propertyIds.includes(propertyId)) {
      return [];
    }

    let params = [propertyId];
    let where = 'WHERE tenants.property_id = $1';
    if (status) {
      params.push(status);
      where += ` AND tenants.status = $${params.length}`;
    }
    if (propertyIds) {
      const { clause, params: scopeParams } = buildPropertyFilter(propertyIds, 'tenants.property_id', params.length);
      where += clause;
      params = [...params, ...scopeParams];
    }

    const result = await pool.query(`SELECT * FROM tenants ${where} ORDER BY created_at DESC`, params);
    return result.rows;
  }

  async create(data, options) {
    // Scope enforcement
    if (options && options.propertyIds) {
      const pid = data.property_id || data.propertyId;
      const scope = options.propertyIds;
      if (!scope.includes('*') && pid && !scope.includes(pid)) {
        const err = new Error('Property not in scope');
        err.status = 403;
        throw err;
      }
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
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
      const result = await client.query(query, values);
      const newTenant = result.rows[0];
      await client.query(`UPDATE rooms SET status = 'occupied', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [data.room_id || data.roomId]);
      await client.query('COMMIT');
      return newTenant;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating tenant:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async update(id, data, options) {
    // Scope check before transaction
    if (options) {
      const existing = await this.findById(id, options);
      if (!existing) return null;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const currentTenant = await client.query('SELECT status, room_id FROM tenants WHERE id = $1', [id]);
      const oldStatus = currentTenant.rows[0]?.status;
      const oldRoomId = currentTenant.rows[0]?.room_id;
      const newStatus = data.status;
      const newRoomId = data.room_id || data.roomId;

      const setClauses = [];
      const values = [];
      let paramIndex = 1;
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
      for (const [key, value] of Object.entries(data)) {
        if (allowedFields.includes(key) && value !== undefined) {
          setClauses.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }
      setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
      if (setClauses.length === 0) throw new Error('No valid fields provided for update');
      values.push(id);
      const query = `UPDATE tenants SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
      const result = await client.query(query, values);
      if (result.rows.length === 0) throw new Error('Tenant not found');
      const updatedTenant = result.rows[0];

      if ((newStatus === 'moved_out' || newStatus === 'archived') && oldStatus === 'active') {
        await client.query(`UPDATE rooms SET status = 'available', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [oldRoomId]);
      }
      if (newStatus === 'active' && (oldStatus === 'moved_out' || oldStatus === 'archived')) {
        await client.query(`UPDATE rooms SET status = 'occupied', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [newRoomId || oldRoomId]);
      }
      if (newRoomId && newRoomId !== oldRoomId && (!newStatus || newStatus === 'active')) {
        await client.query(`UPDATE rooms SET status = 'available', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [oldRoomId]);
        await client.query(`UPDATE rooms SET status = 'occupied', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [newRoomId]);
      }
      await client.query('COMMIT');
      return updatedTenant;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating tenant:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async updateStatus(id, status, options) {
    if (options) {
      const existing = await this.findById(id, options);
      if (!existing) return null;
    }
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const tenantResult = await client.query('SELECT room_id, status FROM tenants WHERE id = $1', [id]);
      if (tenantResult.rows.length === 0) throw new Error('Tenant not found');
      const { room_id: roomId, status: currentStatus } = tenantResult.rows[0];
      const result = await client.query(
        `UPDATE tenants SET status = $1, ${status === 'archived' ? 'archived_at = CURRENT_TIMESTAMP,' : ''} updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
        [status, id]
      );
      if (status === 'moved_out' || status === 'archived') {
        await client.query(`UPDATE rooms SET status = 'available', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [roomId]);
      } else if (status === 'active' && (currentStatus === 'moved_out' || currentStatus === 'archived')) {
        await client.query(`UPDATE rooms SET status = 'occupied', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [roomId]);
      }
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating tenant status:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async delete(id, options) {
    if (options) {
      const existing = await this.findById(id, options);
      if (!existing) return null;
    }
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const tenantResult = await client.query('SELECT room_id, status FROM tenants WHERE id = $1', [id]);
      if (tenantResult.rows.length > 0) {
        const { room_id: roomId, status } = tenantResult.rows[0];
        await client.query('DELETE FROM tenants WHERE id = $1', [id]);
        if (status === 'active') {
          await client.query(`UPDATE rooms SET status = 'available', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [roomId]);
        }
      }
      await client.query('COMMIT');
      return { message: 'Tenant deleted' };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error deleting tenant:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getActiveTenantsByProperty(propertyId, options) {
    if (options && options.propertyIds) {
      const scope = options.propertyIds;
      if (!scope.includes('*') && !scope.includes(propertyId)) return [];
    }
    const result = await pool.query(
      `SELECT t.*, r.room_number FROM tenants t JOIN rooms r ON t.room_id = r.id WHERE t.property_id = $1 AND t.status = 'active' ORDER BY r.room_number`,
      [propertyId]
    );
    return result.rows;
  }
}

module.exports = new TenantRepository();
