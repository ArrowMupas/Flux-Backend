const pool = require('../database/pool');

const safeJsonParse = (jsonString) => {
    try {
        return typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
    } catch (error) {
        console.error('Error parsing JSON:', error, 'Data:', jsonString);
        return jsonString;
    }
};

const safeStringify = (data) => (typeof data === 'string' ? data : JSON.stringify(data));


const parseNotifications = (notifications) =>
    notifications.map((notification) => ({
        ...notification,
        metadata: safeJsonParse(notification.metadata),

        resolved: notification.status === 'resolved',
        is_resolved: notification.status === 'resolved',
        resolution_status: notification.status === 'resolved' ? 'resolved' : 
                          notification.status === 'acknowledged' ? 'acknowledged' : 'active'
    }));

const createInventoryNotification = async ({
    type,
    entity_type,
    entity_id,
    message,
    priority = 'medium',
    metadata = {}
}) => {
    const [result] = await pool.query(
        `INSERT INTO inventory_notifications 
         (type, entity_type, entity_id, message, priority, metadata)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
            type,
            entity_type,
            entity_id,
            message,
            priority,
            safeStringify(metadata)
        ]
    );
    return result.insertId;
};

const getAllInventoryNotifications = async (page = 1, limit = 20, filters = {}) => {
    const offset = (page - 1) * limit;
    const queryParams = [];
    let whereClause = 'WHERE 1=1';

    if (filters.type) {
        whereClause += ' AND type = ?';
        queryParams.push(filters.type);
    }
    if (filters.entity_type) {
        whereClause += ' AND entity_type = ?';
        queryParams.push(filters.entity_type);
    }
    if (filters.entity_id) {
        whereClause += ' AND entity_id = ?';
        queryParams.push(filters.entity_id);
    }
    if (filters.priority) {
        whereClause += ' AND priority = ?';
        queryParams.push(filters.priority);
    }
    if (filters.status) {
        whereClause += ' AND status = ?';
        queryParams.push(filters.status);
    }
    if (filters.dateFrom) {
        whereClause += ' AND created_at >= ?';
        queryParams.push(filters.dateFrom);
    }
    if (filters.dateTo) {
        whereClause += ' AND created_at <= ?';
        queryParams.push(filters.dateTo);
    }

    const [countResult] = await pool.query(
        `SELECT COUNT(*) as total FROM inventory_notifications ${whereClause}`,
        queryParams
    );
    const { total } = countResult[0];

    queryParams.push(limit, offset);
    const [notifications] = await pool.query(
        `SELECT * FROM inventory_notifications
         ${whereClause}
         ORDER BY created_at DESC, priority_order ASC
         LIMIT ? OFFSET ?`,
        queryParams
    );

    return {
        notifications: parseNotifications(notifications),
        pagination: {
            current_page: page,
            total_pages: Math.ceil(total / limit),
            total_records: total,
            per_page: limit,
        },
    };
};

const getNotificationsByEntity = async (entity_type, entity_id, status = null) => {
    let query = `SELECT * FROM inventory_notifications 
                 WHERE entity_type = ? AND entity_id = ?`;
    const params = [entity_type, entity_id];
    
    if (status) {
        query += ' AND status = ?';
        params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [notifications] = await pool.query(query, params);
    return parseNotifications(notifications);
};

const getRecentNotification = async (entity_type, entity_id, type, hoursBack = 24) => {
    const [notifications] = await pool.query(
        `SELECT * FROM inventory_notifications 
         WHERE entity_type = ? AND entity_id = ? AND type = ? 
         AND status = 'active'
         AND created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
         ORDER BY created_at DESC 
         LIMIT 1`,
        [entity_type, entity_id, type, hoursBack]
    );
    
    if (notifications.length > 0) {
        return parseNotifications(notifications)[0];
    }
    return null;
};

const updateNotificationTimestamp = async (notificationId) => {
    await pool.query(
        `UPDATE inventory_notifications 
         SET updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [notificationId]
    );
};

const resolveNotifications = async (entity_type, entity_id, resolved_by = null) => {
    const [result] = await pool.query(
        `UPDATE inventory_notifications 
         SET status = 'resolved', 
             resolved_at = CURRENT_TIMESTAMP,
             resolved_by = ?
         WHERE entity_type = ? AND entity_id = ? AND status IN ('active', 'acknowledged')`,
        [resolved_by, entity_type, entity_id]
    );
    return result.affectedRows;
};

const acknowledgeNotification = async (notificationId, acknowledged_by = null) => {
    const [result] = await pool.query(
        `UPDATE inventory_notifications 
         SET status = 'acknowledged',
             acknowledged_at = CURRENT_TIMESTAMP,
             acknowledged_by = ?
         WHERE id = ?`,
        [acknowledged_by, notificationId]
    );
    return result.affectedRows;
};

const resolveNotification = async (notificationId, resolved_by = null) => {
    const [result] = await pool.query(
        `UPDATE inventory_notifications 
         SET status = 'resolved',
             resolved_at = CURRENT_TIMESTAMP,
             resolved_by = ?
         WHERE id = ? AND status IN ('active', 'acknowledged')`,
        [resolved_by, notificationId]
    );
    return result.affectedRows;
};

const cleanupOldNotifications = async (daysOld = 30) => {
    const [result] = await pool.query(
        `DELETE FROM inventory_notifications 
         WHERE status IN ('resolved', 'acknowledged') 
         AND resolved_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [daysOld]
    );
    return result.affectedRows;
};

const getNotificationSummary = async (dateFrom, dateTo) => {
    const [summary] = await pool.query(
        `SELECT 
            type,
            entity_type,
            priority,
            status,
            COUNT(*) as count
         FROM inventory_notifications 
         WHERE created_at BETWEEN ? AND ?
         GROUP BY type, entity_type, priority, status
         ORDER BY count DESC`,
        [dateFrom, dateTo]
    );
    return summary;
};

const getCriticalNotifications = async () => {
    const [notifications] = await pool.query(
        `SELECT * FROM inventory_notifications 
         WHERE status = 'active' 
         AND priority IN ('high', 'critical')
         ORDER BY priority_order ASC, created_at DESC`
    );
    return parseNotifications(notifications);
};

const getNotificationCounts = async () => {
    const [counts] = await pool.query(
        `SELECT 
            priority,
            status,
            COUNT(*) as count
         FROM inventory_notifications 
         GROUP BY priority, status`
    );
    return counts;
};

module.exports = {
    createInventoryNotification,
    getAllInventoryNotifications,
    getNotificationsByEntity,
    getRecentNotification,
    updateNotificationTimestamp,
    resolveNotifications,
    resolveNotification,
    acknowledgeNotification,
    cleanupOldNotifications,
    getNotificationSummary,
    getCriticalNotifications,
    getNotificationCounts
};
