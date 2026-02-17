// api/repositories/propertyRepository.js

const pool = require('../db');

class PropertyRepository {
  async findAll() {
    const result = await pool.query('SELECT * FROM properties ORDER BY created_at DESC');
    return result.rows;
  }

  async findById(id) {
    const result = await pool.query('SELECT * FROM properties WHERE id = $1', [id]);
    return result.rows[0];
  }

  async create(data) {
    const query = `
      INSERT INTO properties (
        name, address, city, district, postal_code, contact_phone,
        property_manager_id, property_type, total_floors, total_rooms,
        amenities, rules, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    const values = [
      data.name,
      data.address,
      data.city,
      data.district,
      data.postal_code || data.postalCode,
      data.contact_phone || data.contactPhone,
      data.property_manager_id || data.propertyManagerId,
      data.property_type || data.propertyType,
      data.total_floors !== undefined ? data.total_floors : (data.totalFloors || 0),
      data.total_rooms !== undefined ? data.total_rooms : (data.totalRooms || 0),
      JSON.stringify(data.amenities || {}),
      data.rules,
      data.status || 'active'
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async update(id, data) {
    const query = `
      UPDATE properties SET
        name = $1, address = $2, city = $3, district = $4, postal_code = $5,
        contact_phone = $6, property_manager_id = $7, property_type = $8,
        total_floors = $9, total_rooms = $10, amenities = $11, rules = $12,
        status = $13, updated_at = CURRENT_TIMESTAMP
      WHERE id = $14
      RETURNING *
    `;
    const values = [
      data.name,
      data.address,
      data.city,
      data.district,
      data.postal_code || data.postalCode,
      data.contact_phone || data.contactPhone,
      data.property_manager_id || data.propertyManagerId,
      data.property_type || data.propertyType,
      data.total_floors !== undefined ? data.total_floors : (data.totalFloors || 0),
      data.total_rooms !== undefined ? data.total_rooms : (data.totalRooms || 0),
      JSON.stringify(data.amenities || {}),
      data.rules,
      data.status || 'active',
      id
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async delete(id) {
    await pool.query('DELETE FROM properties WHERE id = $1', [id]);
    return { message: 'Property deleted' };
  }
}

module.exports = new PropertyRepository();