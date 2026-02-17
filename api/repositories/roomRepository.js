const pool = require('../db');

class RoomRepository {
  async findAll(propertyId) {
    if (propertyId) {
      const result = await pool.query(
        'SELECT * FROM rooms WHERE property_id = $1 ORDER BY floor, room_number',
        [propertyId]
      );
      return result.rows;
    }
    const result = await pool.query('SELECT * FROM rooms ORDER BY created_at DESC');
    return result.rows;
  }

  async findById(id) {
    const result = await pool.query('SELECT * FROM rooms WHERE id = $1', [id]);
    return result.rows[0];
  }

  async findByPropertyId(propertyId) {
    const result = await pool.query(
      'SELECT * FROM rooms WHERE property_id = $1 ORDER BY floor, room_number',
      [propertyId]
    );
    return result.rows;
  }

  async create(data) {
    const query = `
      INSERT INTO rooms (
        property_id, room_number, floor, room_type, size_sqm,
        occupancy_type, base_monthly_rent, additional_person_fee,
        amenities, status, ac_unit_id, coordinates_x, coordinates_y
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    // Accept both snake_case (from frontend) and camelCase (backward compatibility)
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

  async update(id, data) {
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
    // Accept both snake_case and camelCase
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

  async updateStatus(id, status) {
    const result = await pool.query(
      'UPDATE rooms SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0];
  }

  async delete(id) {
    await pool.query('DELETE FROM rooms WHERE id = $1', [id]);
    return { message: 'Room deleted' };
  }

  async getAvailableRooms(propertyId) {
    const result = await pool.query(
      'SELECT * FROM rooms WHERE property_id = $1 AND status = $2 ORDER BY floor, room_number',
      [propertyId, 'available']
    );
    return result.rows;
  }

  async countByProperty(propertyId) {
    const result = await pool.query(
      'SELECT status, COUNT(*) as count FROM rooms WHERE property_id = $1 GROUP BY status',
      [propertyId]
    );
    return result.rows;
  }
}

module.exports = new RoomRepository();