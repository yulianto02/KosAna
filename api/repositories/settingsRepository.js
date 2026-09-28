// api/repositories/settingsRepository.js - Admin only, no property scoping
// Settings are global (system_settings), not per-property.
// Routes must enforce admin / settings.manage permission.

const pool = require('../db');

class SettingsRepository {
  async getAll() {
    const result = await pool.query('SELECT * FROM system_settings ORDER BY setting_key');
    // Return as object for frontend compatibility (your existing format)
    const settings = {};
    result.rows.forEach(row => {
      settings[row.setting_key] = this.parseValue(row.setting_value, row.setting_type);
    });
    return settings;
  }

  // For raw rows if needed
  async getAllRows() {
    const result = await pool.query('SELECT * FROM system_settings ORDER BY setting_key');
    return result.rows;
  }

  async getByKey(key) {
    const result = await pool.query('SELECT * FROM system_settings WHERE setting_key = $1', [key]);
    if (result.rows[0]) {
      return this.parseValue(result.rows[0].setting_value, result.rows[0].setting_type);
    }
    return null;
  }

  async getRowByKey(key) {
    const result = await pool.query('SELECT * FROM system_settings WHERE setting_key = $1', [key]);
    return result.rows[0] || null;
  }

  async set(key, value, type, updatedBy, description = null) {
    const inferredType = type || this.inferType(value);
    const stringValue = this.stringifyValue(value, inferredType);
    const result = await pool.query(
      `INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by, description)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (setting_key) 
       DO UPDATE SET 
         setting_value = EXCLUDED.setting_value,
         setting_type = EXCLUDED.setting_type,
         updated_by = EXCLUDED.updated_by,
         description = COALESCE(EXCLUDED.description, system_settings.description),
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [key, stringValue, inferredType, updatedBy, description]
    );
    return result.rows[0];
  }

  async updateMultiple(settings, updatedBy) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const [key, value] of Object.entries(settings)) {
        // Support both { key: value } and { key: { value, type } } formats from frontend
        let actualValue = value;
        let actualType = null;
        if (value && typeof value === 'object' && !Array.isArray(value) && 'value' in value) {
          actualValue = value.value;
          actualType = value.type || this.inferType(actualValue);
        } else {
          actualType = this.inferType(actualValue);
        }
        const stringValue = this.stringifyValue(actualValue, actualType);
        await client.query(
          `INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_by)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (setting_key) 
           DO UPDATE SET 
             setting_value = EXCLUDED.setting_value,
             setting_type = EXCLUDED.setting_type,
             updated_by = EXCLUDED.updated_by,
             updated_at = CURRENT_TIMESTAMP`,
          [key, stringValue, actualType, updatedBy]
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

  // Helpers
  parseValue(value, type) {
    if (value === null || value === undefined) return value;
    try {
      switch (type) {
        case 'number': return parseFloat(value);
        case 'boolean': return value === 'true' || value === true;
        case 'json': return typeof value === 'string' ? JSON.parse(value) : value;
        default: return value;
      }
    } catch {
      return value;
    }
  }

  stringifyValue(value, type) {
    if (type === 'json') return JSON.stringify(value);
    if (value === null || value === undefined) return null;
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
