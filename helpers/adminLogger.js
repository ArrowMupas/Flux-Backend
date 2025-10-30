const logger = require('../utilities/logger');

async function logAdminAction({
    req,
    action_type,
    entity_type,
    entity_id,
    entity_name,
    description,
    before_data = null,
    after_data = null,
}) {
    if (!req.user) return;

    const { id: user_id, username, role } = req.user;

    try {
        logger.info('Admin action', {
            user_id,
            username,
            role,
            action_type,
            entity_type,
            entity_id,
            entity_name,
            description,
            before_data,
            after_data,
            ip: req.ip,
            user_agent: req.get('user-agent'),
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        console.error('Failed to send log:', err);
    }
}

module.exports = logAdminAction;
