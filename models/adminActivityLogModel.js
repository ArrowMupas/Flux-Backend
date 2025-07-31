const pool = require('../database/pool');

// Helper: safely parse stringified JSON
const safeJsonParse = (jsonString) => {
    try {
        return typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
    } catch (error) {
        console.error('Error parsing JSON:', error, 'Data:', jsonString);
        return jsonString;
    }
};

// Helper: force stringify if needed
const safeStringify = (data) => (typeof data === 'string' ? data : JSON.stringify(data));

// Helper: parse all logs
const parseLogs = (logs) =>
    logs.map((log) => ({
        ...log,
        before_data: safeJsonParse(log.before_data),
        after_data: safeJsonParse(log.after_data),
    }));

// Insert admin activity log
const logAdminActivity = async (
    userId,
    username,
    role,
    actionType,
    entityType,
    entityId,
    description,
    beforeData = null,
    afterData = null
) => {
    const [result] = await pool.query(
        `INSERT INTO admin_activity_logs 
         (user_id, username, role, action_type, entity_type, entity_id, description, before_data, after_data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            userId,
            username,
            role,
            actionType,
            entityType,
            entityId,
            description,
            beforeData ? safeStringify(beforeData) : null,
            afterData ? safeStringify(afterData) : null,
        ]
    );
    return result.insertId;
};

// Get all logs with filters + pagination
const getAllAdminActivityLogs = async (page = 1, limit = 20, filters = {}) => {
    const offset = (page - 1) * limit;
    const queryParams = [];
    let whereClause = 'WHERE 1=1';

    if (filters.userId) {
        whereClause += ' AND user_id = ?';
        queryParams.push(filters.userId);
    }
    if (filters.role) {
        whereClause += ' AND role = ?';
        queryParams.push(filters.role);
    }
    if (filters.actionType) {
        whereClause += ' AND action_type = ?';
        queryParams.push(filters.actionType);
    }
    if (filters.entityType) {
        whereClause += ' AND entity_type = ?';
        queryParams.push(filters.entityType);
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
        `SELECT COUNT(*) as total FROM admin_activity_logs ${whereClause}`,
        queryParams
    );
    const { total } = countResult[0];

    queryParams.push(limit, offset);

    const [logs] = await pool.query(
        `SELECT * FROM admin_activity_logs
         ${whereClause}
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        queryParams
    );

    return {
        logs: parseLogs(logs),
        pagination: {
            current_page: page,
            total_pages: Math.ceil(total / limit),
            total_records: total,
            per_page: limit,
        },
    };
};

// Get logs by user
const getAdminActivityLogsByUserId = async (userId, page = 1, limit = 10) => {
    const offset = (page - 1) * limit;
    const [logs] = await pool.query(
        `SELECT * FROM admin_activity_logs 
         WHERE user_id = ? 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [userId, limit, offset]
    );
    return parseLogs(logs);
};

// Get logs by entity
const getAdminActivityLogsByEntity = async (entityType, entityId) => {
    const [logs] = await pool.query(
        `SELECT * FROM admin_activity_logs 
         WHERE entity_type = ? AND entity_id = ? 
         ORDER BY created_at DESC`,
        [entityType, entityId]
    );
    return parseLogs(logs);
};

// Summary stats
const getActivitySummary = async (dateFrom, dateTo) => {
    const [summary] = await pool.query(
        `SELECT 
            action_type,
            entity_type,
            role,
            COUNT(*) as count
         FROM admin_activity_logs 
         WHERE created_at BETWEEN ? AND ?
         GROUP BY action_type, entity_type, role
         ORDER BY count DESC`,
        [dateFrom, dateTo]
    );
    return summary;
};

module.exports = {
    logAdminActivity,
    getAllAdminActivityLogs,
    getAdminActivityLogsByUserId,
    getAdminActivityLogsByEntity,
    getActivitySummary,
};
