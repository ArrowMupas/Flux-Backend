// By Yours truly
const knex = require('../database/knex');

async function logAdminAction({
    req,
    action_type,
    entity_type,
    entity_id,
    description,
    before_data = null,
    after_data = null,
}) {
    if (!req.user) return; // Skip if no user info

    const { id: user_id, username, role } = req.user;

    await knex('admin_activity_logs').insert({
        user_id,
        username,
        role,
        action_type,
        entity_type,
        entity_id,
        description,
        before_data: before_data ? JSON.stringify(before_data) : null,
        after_data: after_data ? JSON.stringify(after_data) : null,
    });
}

module.exports = logAdminAction;
