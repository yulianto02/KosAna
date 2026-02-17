const pool = require('../db');

class PaymentRepository {
  async findAll(params = {}) {
    let query = 'SELECT * FROM payments';
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (params.status) {
      conditions.push(`payment_status = $${paramIndex}`);
      values.push(params.status);
      paramIndex++;
    }
    if (params.tenantId) {
      conditions.push(`tenant_id = $${paramIndex}`);
      values.push(params.tenantId);
      paramIndex++;
    }
    if (params.propertyId) {
      conditions.push(`property_id = $${paramIndex}`);
      values.push(params.propertyId);
      paramIndex++;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, values);
    return result.rows;
  }

  async findById(id) {
    const result = await pool.query('SELECT * FROM payments WHERE id = $1', [id]);
    return result.rows[0];
  }

  async findByTenantId(tenantId) {
    const result = await pool.query(
      'SELECT * FROM payments WHERE tenant_id = $1 ORDER BY payment_period DESC',
      [tenantId]
    );
    return result.rows;
  }

// api/repositories/paymentRepository.js - UPDATED
async create(data) {
  const query = `
    INSERT INTO payments (
      tenant_id, room_id, property_id, payment_period, base_amount,
      additional_person_fee, late_fee, laundry_amount, total_amount,
      payment_method, payment_status, payment_date, due_date, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *
  `;
  const values = [
    data.tenant_id,        // Changed from tenantId
    data.room_id,          // Changed from roomId
    data.property_id,      // Changed from propertyId
    data.payment_period,   // Changed from paymentPeriod
    data.base_amount,      // Changed from baseAmount
    data.additional_person_fee || 0,  // Changed from additionalPersonFee
    data.late_fee || 0,    // Changed from lateFee
    data.laundry_amount || 0,  // Changed from laundryAmount
    data.total_amount,     // Changed from totalAmount
    data.payment_method || 'qris',  // Changed from paymentMethod
    data.payment_status || 'pending',  // Changed from paymentStatus
    data.payment_date || null,  // Changed from paymentDate
    data.due_date,         // Changed from dueDate
    data.notes || null
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
}

async update(id, data) {
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
    data.tenant_id,        // Changed from tenantId
    data.room_id,          // Changed from roomId
    data.property_id,      // Changed from propertyId
    data.payment_period,   // Changed from paymentPeriod
    data.base_amount,      // Changed from baseAmount
    data.additional_person_fee,  // Changed from additionalPersonFee
    data.late_fee,         // Changed from lateFee
    data.laundry_amount,   // Changed from laundryAmount
    data.total_amount,     // Changed from totalAmount
    data.payment_method,   // Changed from paymentMethod
    data.payment_status,   // Changed from paymentStatus
    data.payment_date,     // Changed from paymentDate
    data.due_date,         // Changed from dueDate
    data.qr_code_url || null,  // Changed from qrCodeUrl
    data.transaction_id || null,  // Changed from transactionId
    data.payment_proof_url || null,  // Changed from paymentProofUrl
    data.notes,
    data.paid_at || null,  // Changed from paidAt
    id
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
}

  async markAsPaid(id, paymentData = {}) {
    const result = await pool.query(
      `UPDATE payments SET 
        payment_status = 'paid',
        payment_date = COALESCE($1, CURRENT_DATE),
        paid_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [paymentData.paymentDate || null, id]
    );
    return result.rows[0];
  }

  async delete(id) {
    await pool.query('DELETE FROM payments WHERE id = $1', [id]);
    return { message: 'Payment deleted' };
  }

  async getPendingPayments() {
    const result = await pool.query(`
      SELECT p.*, t.full_name as tenant_name, r.room_number
      FROM payments p
      JOIN tenants t ON p.tenant_id = t.id
      JOIN rooms r ON p.room_id = r.id
      WHERE p.payment_status = 'pending'
      ORDER BY p.due_date ASC
    `);
    return result.rows;
  }

  async getRevenueByPeriod(period) {
    const result = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as revenue
       FROM payments 
       WHERE payment_status = 'paid' AND payment_period = $1`,
      [period]
    );
    return result.rows[0].revenue;
  }
}

module.exports = new PaymentRepository();