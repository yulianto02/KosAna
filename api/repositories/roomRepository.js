// api/repositories/roomRepository.js - Scoped version adapted to your existing class
const pool = require('../db');
const { buildPropertyFilter } = require('../utils/scope');

class RoomRepository {
  // Original: findAll(propertyId) -> now also supports findAll({ propertyId, propertyIds })
  async findAll(propertyIdOrOptions, maybeOptions) {
    let propertyId = null;
    let propertyIds = null;
    let status = null;

    // Parse args
    if (typeof propertyIdOrOptions === 'string') {
      propertyId = propertyIdOrOptions;
      if (maybeOptions) {
        propertyIds = maybeOptions.propertyIds || null;
        status = maybeOptions.status || null;
      }
    } else if (typeof propertyIdOrOptions === 'object' && propertyIdOrOptions !== null) {
      propertyId = propertyIdOrOptions.propertyId || propertyIdOrOptions.property_id || null;
      propertyIds = propertyIdOrOptions.propertyIds || null;
      status = propertyIdOrOptions.status || null;
    }

    let params = [];
    let where = 'WHERE 1=1';

    if (propertyId) {
      params.push(propertyId);
      where += ` AND rooms.property_id = $${params.length}`;
    }

    if (propertyIds) {
      const { clause, params: scopeParams } = buildPropertyFilter(propertyIds, 'rooms.property_id', params.length);
      where += clause;
      params = [...params, ...scopeParams];
    }

    if (status) {
      params.push(status);
      where += ` AND rooms.status = $${params.length}`;
    }

    const result = await pool.query(`SELECT * FROM rooms ${where} ORDER BY floor, room_number`, params);
    return result.rows;
  }

  async findById(id, options) {
    let propertyIds = null;
    if (Array.isArray(options)) propertyIds = options;
    else if (options && options.propertyIds) propertyIds = options.propertyIds;

    let params = [id];
    let where = 'WHERE rooms.id = $1';
    if (propertyIds) {
      const { clause, params: scopeParams } = buildPropertyFilter(propertyIds, 'rooms.property_id', params.length);
      where += clause;
      params = [...params, ...scopeParams];
    }

    const result = await pool.query(`SELECT * FROM rooms ${where}`, params);
    return result.rows[0];
  }

  async findByPropertyId(propertyId, options) {
    return this.findAll(propertyId, options);
  }

  async create(data, options) {
    // Scope enforcement on create
    if (options && options.propertyIds) {
      const pid = data.property_id || data.propertyId;
      const scope = options.propertyIds;
      if (!scope.includes('*') && !scope.includes(pid)) {
        const err = new Error('Property not in scope');
        err.status = 403;
        throw err;
      }
    }

    const query = `
      INSERT INTO rooms (
        property_id, room_number, floor, room_type, size_sqm,
        occupancy_type, base_monthly_rent, additional_person_fee,
        amenities, status, ac_unit_id, coordinates_x, coordinates_y
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    const values = [
      data.property_id || data.propertyId,
      data.room_number || data.roomNumber,
      data.floor,
      data.room_type || data.roomType,
      data.size_sqm || data.sizeSqm || null,
      data.occupancy_type || data.occupancyType || 'single',
      data.base_monthly_rent || data.baseMonthlyRent,
      data.additional_person_fee || data.additionalPersonFee || 0,
      JSON.stringify(data.amenities || {}),
      data.status || 'available',
      data.ac_unit_id || data.acUnitId || null,
      data.coordinates_x || data.coordinatesX || null,
      data.coordinates_y || data.coordinatesY || null
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async update(id, data, options) {
    // Scope check
    if (options) {
      const existing = await this.findById(id, options);
      if (!existing) return null;
    }
    const query = `
      UPDATE rooms SET
        property_id = $1, room_number = $2, floor = $3, room_type = $4,
        size_sqm = $5, occupancy_type = $6, base_monthly_rent = $7,
        additional_person_fee = $8, amenities = $9, status = $10,
        ac_unit_id = $11, coordinates_x = $12, coordinates_y = $13,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $14
      RETURNING *
    `;
    const values = [
      data.property_id || data.propertyId,
      data.room_number || data.roomNumber,
      data.floor,
      data.room_type || data.roomType,
      data.size_sqm || data.sizeSqm,
      data.occupancy_type || data.occupancyType,
      data.base_monthly_rent || data.baseMonthlyRent,
      data.additional_person_fee || data.additionalPersonFee,
      JSON.stringify(data.amenities),
      data.status,
      data.ac_unit_id || data.acUnitId,
      data.coordinates_x || data.coordinatesX,
      data.coordinates_y || data.coordinatesY,
      id
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async updateStatus(id, status, options) {
    if (options) {
      const existing = await this.findById(id, options);
      if (!existing) return null;
    }
    const result = await pool.query(
      'UPDATE rooms SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0];
  }

  async delete(id, options) {
    if (options) {
      const existing = await this.findById(id, options);
      if (!existing) return null;
    }
    await pool.query('DELETE FROM rooms WHERE id = $1', [id]);
    return { message: 'Room deleted' };
  }

  async getAvailableRooms(propertyId, options) {
    let params = [propertyId, 'available'];
    let where = 'WHERE rooms.property_id = $1 AND rooms.status = $2';
    if (options && options.propertyIds) {
      const { clause, params: scopeParams } = buildPropertyFilter(options.propertyIds, 'rooms.property_id', params.length);
      where += clause;
      params = [...params, ...scopeParams];
    }
    const result = await pool.query(`SELECT * FROM rooms ${where} ORDER BY floor, room_number`, params);
    return result.rows;
  }

  async countByProperty(propertyId, options) {
    // If scoped and propertyId not in scope, return empty
    if (options && options.propertyIds) {
      const scope = options.propertyIds;
      if (!scope.includes('*') && !scope.includes(propertyId)) return [];
    }
    const result = await pool.query(
      'SELECT status, COUNT(*) as count FROM rooms WHERE property_id = $1 GROUP BY status',
      [propertyId]
    );
    return result.rows;
  }
}

module.exports = new RoomRepository();
