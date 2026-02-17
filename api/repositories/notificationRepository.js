const pool = require('../db');

class NotificationRepository {
  async findAll() {
    const result = await pool.query('SELECT * FROM notifications ORDER BY created_at DESC');
    return result.rows;
  }

  async findByUserId(userId, unreadOnly = false) {
    let query = 'SELECT * FROM notifications WHERE user_id = $1';
    const params = [userId];
    
    if (unreadOnly) {
      query += ' AND is_read = false';
    }
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  async findById(id) {
    const result = await pool.query('SELECT * FROM notifications WHERE id = $1', [id]);
    return result.rows[0];
  }

  async create(data) {
    const query = `
      INSERT INTO notifications (
        user_id, title, message, type, action_url, related_entity_type, related_entity_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      data.userId,
      data.title,
      data.message,
      data.type,
      data.actionUrl || null,
      data.relatedEntityType || null,
      data.relatedEntityId || null
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async markAsRead(id) {
    const result = await pool.query(
      `UPDATE notifications SET 
        is_read = true,
        read_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    return result.rows[0];
  }

  async markAllAsRead(userId) {
    await pool.query(
      `UPDATE notifications SET 
        is_read = true,
        read_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
    return { message: 'All notifications marked as read' };
  }

  async delete(id) {
    await pool.query('DELETE FROM notifications WHERE id = $1', [id]);
    return { message: 'Notification deleted' };
  }

  async deleteOldNotifications(days = 30) {
    await pool.query(
      `DELETE FROM notifications 
       WHERE created_at < CURRENT_DATE - INTERVAL '${days} days'`
    );
    return { message: `Notifications older than ${days} days deleted` };
  }

  async getUnreadCount(userId) {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );
    return parseInt(result.rows[0].count);
  }
}

module.exports = new NotificationRepository();