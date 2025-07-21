const pool = require('../database/pool');

// Helper function to safely parse JSON
const safeJsonParse = (jsonString) => {
    try {
        return jsonString ? JSON.parse(jsonString) : null;
    } catch (error) {
        console.error('Error parsing JSON:', error, 'Data:', jsonString);
        return jsonString; // Return original string if parsing fails
    }
};

// Function to log admin/staff activity
const logAdminActivity = async (userId, username, role, actionType, entityType, entityId, description, beforeData = null, afterData = null) => {
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
            beforeData ? JSON.stringify(beforeData) : null,
            afterData ? JSON.stringify(afterData) : null
        ]
    );
    return result.insertId;
};

// Function to get all admin activity logs with pagination
const getAllAdminActivityLogs = async (page = 1, limit = 20, filters = {}) => {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const queryParams = [];

    // Apply filters
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

    // Get total count
    const [countResult] = await pool.query(
        `SELECT COUNT(*) as total FROM admin_activity_logs ${whereClause}`,
        queryParams
    );
    const total = countResult[0].total;

    // Get paginated results
    queryParams.push(limit, offset);
    const [logs] = await pool.query(
        `SELECT 
            id,
            user_id,
            username,
            role,
            action_type,
            entity_type,
            entity_id,
            description,
            before_data,
            after_data,
            created_at
         FROM admin_activity_logs 
         ${whereClause}
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        queryParams
    );

    // Parse JSON data
    const parsedLogs = logs.map(log => {
        let beforeData = null;
        let afterData = null;
        
        try {
            beforeData = log.before_data ? JSON.parse(log.before_data) : null;
        } catch (error) {
            console.error('Error parsing before_data JSON for log ID', log.id, ':', error);
            beforeData = log.before_data; // Keep original if parsing fails
        }
        
        try {
            afterData = log.after_data ? JSON.parse(log.after_data) : null;
        } catch (error) {
            console.error('Error parsing after_data JSON for log ID', log.id, ':', error);
            afterData = log.after_data; // Keep original if parsing fails
        }
        
        return {
            ...log,
            before_data: beforeData,
            after_data: afterData
        };
    });

    return {
        logs: parsedLogs,
        pagination: {
            current_page: page,
            total_pages: Math.ceil(total / limit),
            total_records: total,
            per_page: limit
        }
    };
};

// Function to get admin activity logs by user ID
const getAdminActivityLogsByUserId = async (userId, page = 1, limit = 10) => {
    const offset = (page - 1) * limit;
    
    const [logs] = await pool.query(
        `SELECT 
            id,
            user_id,
            username,
            role,
            action_type,
            entity_type,
            entity_id,
            description,
            before_data,
            after_data,
            created_at
         FROM admin_activity_logs 
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [userId, limit, offset]
    );

    // Parse JSON data
    const parsedLogs = logs.map(log => ({
        ...log,
        before_data: safeJsonParse(log.before_data),
        after_data: safeJsonParse(log.after_data)
    }));

    return parsedLogs;
};

// Function to get admin activity logs by entity
const getAdminActivityLogsByEntity = async (entityType, entityId) => {
    const [logs] = await pool.query(
        `SELECT 
            id,
            user_id,
            username,
            role,
            action_type,
            entity_type,
            entity_id,
            description,
            before_data,
            after_data,
            created_at
         FROM admin_activity_logs 
         WHERE entity_type = ? AND entity_id = ?
         ORDER BY created_at DESC`,
        [entityType, entityId]
    );

    // Parse JSON data
    const parsedLogs = logs.map(log => ({
        ...log,
        before_data: safeJsonParse(log.before_data),
        after_data: safeJsonParse(log.after_data)
    }));

    return parsedLogs;
};

// Function to get activity summary/statistics
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
    getActivitySummary
};
