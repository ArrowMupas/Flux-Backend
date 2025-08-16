// Middleware to log admin actions
const logAdminAction = require('../helpers/adminLogger');

function adminLogMiddleware({ entity_type, action_type }) {
    return (req, res, next) => {
        res.on('finish', async () => {
            try {
                if (res.statusCode >= 400) {
                    return;
                }
                if (!res.locals.logData) {
                    return;
                }
                if (!res.locals.logData.entity_id) {
                    return;
                }

                // Resolve action_type if it's a function
                const resolvedActionType =
                    typeof action_type === 'function' ? action_type(req, res) : action_type;

                await logAdminAction({
                    req,
                    entity_type,
                    action_type: resolvedActionType,
                    ...(res.locals.logData || {}), // Additional data from res.locals
                });
            } catch (err) {
                console.error('Failed to log admin action:', err);
            }
        });
        next();
    };
}

module.exports = adminLogMiddleware;
