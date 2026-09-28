// api/repositories/paymentRepository.js - Scoped, adapted to your existing implementation
const pool = require('../db');
const { buildPropertyFilter } = require('../utils/scope');

class PaymentRepository {
  async findAll(params = {}) {
    // params can be: { status, tenantId, tenant_id, propertyId, property_id, propertyIds }
    let query = 'SELECT * FROM payments';
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (params.status) {
      conditions.push(`payment_status = $${paramIndex}`);
      values.push(params.status);
      paramIndex++;
    }
    if (params.tenantId || params.tenant_id) {
      conditions.push(`tenant_id = $${paramIndex}`);
      values.push(params.tenantId || params.tenant_id);
      paramIndex++;
    }
    const singlePropertyId = params.propertyId || params.property_id;
    if (singlePropertyId) {
      conditions.push(`property_id = $${paramIndex}`);
      values.push(singlePropertyId);
      paramIndex++;
    }

    // Scope filter
    const propertyIds = params.propertyIds;
    if (propertyIds) {
      const { clause, params: scopeParams } = buildPropertyFilter(propertyIds, 'payments.property_id', values.length);
      if (clause) {
        if (clause.includes('1=0')) {
          // No access
          const result = await pool.query('SELECT * FROM payments WHERE 1=0');
          return result.rows;
        }
        conditions.push(clause.replace(/^ AND /, ''));
        values.push(...scopeParams);
        paramIndex = values.length + 1;
      }
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, values);
    return result.rows;
  }

  async findById(id, options) {
    let propertyIds = null;
    if (Array.isArray(options)) propertyIds = options;
    else if (options && options.propertyIds) propertyIds = options.propertyIds;

    let params = [id];
    let where = 'WHERE id = $1';
    if (propertyIds) {
      const { clause, params: scopeParams } = buildPropertyFilter(propertyIds, 'payments.property_id', params.length);
      where += clause;
      params = [...params, ...scopeParams];
    }
    const result = await pool.query(`SELECT * FROM payments ${where}`, params);
    return result.rows[0];
  }

  async findByTenantId(tenantId, options) {
    let propertyIds = options?.propertyIds || null;
    let params = [tenantId];
    let where = 'WHERE tenant_id = $1';
    if (propertyIds) {
      const { clause, params: scopeParams } = buildPropertyFilter(propertyIds, 'payments.property_id', params.length);
      where += clause;
      params = [...params, ...scopeParams];
    }
    const result = await pool.query(`SELECT * FROM payments ${where} ORDER BY payment_period DESC`, params);
    return result.rows;
  }

  async create(data, options) {
    // Scope enforcement
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
      INSERT INTO payments (
        tenant_id, room_id, property_id, payment_period, base_amount,
        additional_person_fee, late_fee, laundry_amount, total_amount,
        payment_method, payment_status, payment_date, due_date, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;
    const values = [
      data.tenant_id || data.tenantId,
      data.room_id || data.roomId,
      data.property_id || data.propertyId,
      data.payment_period || data.paymentPeriod,
      data.base_amount || data.baseAmount,
      data.additional_person_fee || data.additionalPersonFee || 0,
      data.late_fee || data.lateFee || 0,
      data.laundry_amount || data.laundryAmount || 0,
      data.total_amount || data.totalAmount,
      data.payment_method || data.paymentMethod || 'qris',
      data.payment_status || data.paymentStatus || 'pending',
      data.payment_date || data.paymentDate || null,
      data.due_date || data.dueDate,
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
      UPDATE payments SET
        tenant_id = $1, room_id = $2, property_id = $3, payment_period = $4,
        base_amount = $5, additional_person_fee = $6, late_fee = $7,
        laundry_amount = $8, total_amount = $9, payment_method = $10,
        payment_status = $11, payment_date = $12, due_date = $13,
        qr_code_url = $14, transaction_id = $15, payment_proof_url = $16,
        notes = $17, paid_at = $18, updated_at = CURRENT_TIMESTAMP
      WHERE id = $19
      RETURNING *
    `;
    const values = [
      data.tenant_id || data.tenantId,
      data.room_id || data.roomId,
      data.property_id || data.propertyId,
      data.payment_period || data.paymentPeriod,
      data.base_amount || data.baseAmount,
      data.additional_person_fee || data.additionalPersonFee,
      data.late_fee || data.lateFee,
      data.laundry_amount || data.laundryAmount,
      data.total_amount || data.totalAmount,
      data.payment_method || data.paymentMethod,
      data.payment_status || data.paymentStatus,
      data.payment_date || data.paymentDate,
      data.due_date || data.dueDate,
      data.qr_code_url || data.qrCodeUrl || null,
      data.transaction_id || data.transactionId || null,
      data.payment_proof_url || data.paymentProofUrl || null,
      data.notes,
      data.paid_at || data.paidAt || null,
      id
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async markAsPaid(id, paymentData = {}, options) {
    if (options) {
      const existing = await this.findById(id, options);
      if (!existing) return null;
    }
    const result = await pool.query(
      `UPDATE payments SET 
        payment_status = 'paid',
        payment_date = COALESCE($1, CURRENT_DATE),
        paid_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [paymentData.paymentDate || paymentData.payment_date || null, id]
    );
    return result.rows[0];
  }

  async delete(id, options) {
    if (options) {
      const existing = await this.findById(id, options);
      if (!existing) return null;
    }
    await pool.query('DELETE FROM payments WHERE id = $1', [id]);
    return { message: 'Payment deleted' };
  }

  async getPendingPayments(options = {}) {
    let propertyIds = options.propertyIds || null;
    let params = [];
    let where = `WHERE payments.payment_status = 'pending'`;
    if (propertyIds) {
      const { clause, params: scopeParams } = buildPropertyFilter(propertyIds, 'payments.property_id', params.length);
      where += clause;
      params = [...params, ...scopeParams];
    }
    const result = await pool.query(`
      SELECT p.*, t.full_name as tenant_name, r.room_number
      FROM payments p
      JOIN tenants t ON p.tenant_id = t.id
      JOIN rooms r ON p.room_id = r.id
      ${where}
      ORDER BY p.due_date ASC
    `, params);
    return result.rows;
  }

  async getRevenueByPeriod(period, options = {}) {
    // options can be string legacy or object
    let propertyIds = null;
    let propertyId = null;
    if (typeof options === 'string') {
      // legacy not used
    } else if (options && options.propertyIds) {
      propertyIds = options.propertyIds;
    } else if (options && (options.propertyId || options.property_id)) {
      propertyId = options.propertyId || options.property_id;
    } else if (Array.isArray(options)) {
      propertyIds = options;
    }

    let params = [period];
    let where = `WHERE payment_status = 'paid' AND payment_period = $1`;

    if (propertyId) {
      params.push(propertyId);
      where += ` AND property_id = $${params.length}`;
    }
    if (propertyIds) {
      const { clause, params: scopeParams } = buildPropertyFilter(propertyIds, 'payments.property_id', params.length);
      where += clause;
      params = [...params, ...scopeParams];
    }

    const result = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as revenue FROM payments ${where}`,
      params
    );
    return result.rows[0].revenue;
  }
}

module.exports = new PaymentRepository();
