const pool = require('../database/pool');

// Create new notification
const createNotification = async ({ user_id, type = 'info', title, message, order_id = null }) => {
    const [result] = await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, order_id)
         VALUES (?, ?, ?, ?, ?)`,
        [user_id, type, title, message, order_id]
    );

    const [rows] = await pool.query(`SELECT * FROM notifications WHERE id = ?`, [result.insertId]);
    return rows[0];
};

// Get all notifications for a user
const getUserNotifications = async (user_id) => {
    const [rows] = await pool.query(
        `SELECT * FROM notifications
         WHERE user_id = ? AND status = 'unread'
         ORDER BY created_at DESC`,
        [user_id]
    );
    return rows;
};

// Mark a single notification as read (but verify ownership)
const markAsRead = async (id, user_id) => {
    const [result] = await pool.query(
        `UPDATE notifications
         SET status = 'read'
         WHERE id = ? AND user_id = ?`,
        [id, user_id]
    );
    return result.affectedRows > 0; // tells controller if update succeeded
};

// Mark all notifications as read
const markAllAsRead = async (user_id) => {
    const [result] = await pool.query(
        `UPDATE notifications
         SET status = 'read'
         WHERE user_id = ? AND status = 'unread'`,
        [user_id]
    );
    return result.affectedRows;
};

// Delete a notification (owned by user)
const deleteNotification = async (id, user_id) => {
    const [result] = await pool.query(`DELETE FROM notifications WHERE id = ? AND user_id = ?`, [id, user_id]);
    return result.affectedRows > 0;
};

module.exports = {
    createNotification,
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
};
