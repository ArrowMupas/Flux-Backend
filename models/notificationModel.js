const pool = require('../database/pool');

const createNotification = async (data) => {
    const { title, message, type = 'info', is_global = true, user_id = null } = data;
    await pool.query(
        `INSERT INTO notifications (title, message, type, is_global, user_id)
     VALUES (?, ?, ?, ?, ?)`,
        [title, message, type, is_global, user_id]
    );
};

const getNotificationsForUser = async (userId) => {
    const [rows] = await pool.query(
        `
    SELECT * FROM notifications
    WHERE is_global = TRUE OR user_id = ?
    ORDER BY created_at DESC`,
        [userId]
    );
    return rows;
};

const markNotificationAsRead = async (id) => {
    await pool.query(`UPDATE notifications SET is_read = TRUE WHERE notification_id = ?`, [id]);
};

const markAllNotificationsAsRead = async (userId) => {
    await pool.query(
        `
    UPDATE notifications
    SET is_read = TRUE
    WHERE user_id = ? OR is_global = TRUE`,
        [userId]
    );
};

module.exports = {
    createNotification,
    getNotificationsForUser,
    markNotificationAsRead,
    markAllNotificationsAsRead,
};
