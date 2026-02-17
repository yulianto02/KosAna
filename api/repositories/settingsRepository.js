const pool = require('../db');

class SettingsRepository {
  async getAll() {
    const result = await pool.query('SELECT * FROM system_settings ORDER BY setting_key');
    // Convert to object format like your JSON
    const settings = {};
    result.rows.forEach(row => {
      settings[row.setting_key] = this.parseValue(row.setting_value, row.setting_type);
    });
    return settings;
  }

  async getByKey(key) {
    const result = await pool.query(
      'SELECT * FROM system_settings WHERE setting_key = $1',
      [key]
    );
    if (result.rows[0]) {
      return this.parseValue(result.rows[0].setting_value, result.rows[0].setting_type);
    }
    return null;
  }

  async set(key, value, type, updatedBy, description = null) {
    const stringValue = this.stringifyValue(value, type);
    
    const result = await pool.query(
      `INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by, description)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (setting_key) 
       DO UPDATE SET 
         setting_value = EXCLUDED.setting_value,
         setting_type = EXCLUDED.setting_type,
         updated_by = EXCLUDED.updated_by,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [key, stringValue, type, updatedBy, description]
    );
    return result.rows[0];
  }

  async updateMultiple(settings, updatedBy) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      for (const [key, value] of Object.entries(settings)) {
        const type = this.inferType(value);
        const stringValue = this.stringifyValue(value, type);
        
        await client.query(
          `INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (setting_key) 
           DO UPDATE SET 
             setting_value = EXCLUDED.setting_value,
             setting_type = EXCLUDED.setting_type,
             updated_by = EXCLUDED.updated_by,
             updated_at = CURRENT_TIMESTAMP`,
          [key, stringValue, type, updatedBy]
        );
      }
      
      await client.query('COMMIT');
      return await this.getAll();
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async delete(key) {
    await pool.query('DELETE FROM system_settings WHERE setting_key = $1', [key]);
    return { message: 'Setting deleted' };
  }

  // Helper methods
  parseValue(value, type) {
    switch (type) {
      case 'number': return parseFloat(value);
      case 'boolean': return value === 'true';
      case 'json': return JSON.parse(value);
      default: return value;
    }
  }

  stringifyValue(value, type) {
    if (type === 'json') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  inferType(value) {
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'object') return 'json';
    return 'string';
  }
}

module.exports = new SettingsRepository();