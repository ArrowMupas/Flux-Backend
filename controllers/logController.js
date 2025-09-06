const axios = require('axios');
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

const fetchAxiomLogs = async (aplQuery) => {
    const dataset = process.env.AXIOM_DATASET;
    const token = process.env.AXIOM_TOKEN;

    if (!dataset || !token) throw new Error('AXIOM_DATASET or AXIOM_TOKEN not defined');

    const response = await axios.post(
        `https://cloud.axiom.co/api/v1/datasets/_apl?format=legacy`,
        {
            apl: `['${dataset}'] | ${aplQuery}`,
            startTime: sevenDaysAgo,
            endTime: new Date().toISOString(),
        },
        {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        }
    );

    return response.data.matches || [];
};

const getSignins = async (req, res) => {
    try {
        const matches = await fetchAxiomLogs(
            'where message =~ "login" | order by _time desc | limit 50'
        );

        const logins = matches.map((match) => {
            const data = match.data || {};
            return {
                id: match._rowId,
                user_id: data.user_id || data.userId || data.fields?.userId,
                username: data.username || data.fields?.username,
                role: data.role || data.fields?.role,
                service: data.service,
                ip: data.ip,
                user_agent: data.user_agent,
                message: data.message,
                created_at: data.timestamp || match._time,
            };
        });

        res.json({
            data: logins,
            pagination: { total_records: logins.length, total_pages: 1, current_page: 1 },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch login logs' });
    }
};
const getAdminAuditLogs = async (req, res) => {
    // console.log('You reached me'); uncomment if you want to see how the cache work
    try {
        const matches = await fetchAxiomLogs(
            'where message =~ "Admin action" | order by _time desc | limit 20'
        );

        const cleanData = (data) =>
            Object.fromEntries(
                Object.entries(data).filter(([_, value]) => value !== null && value !== undefined)
            );

        const logs = matches.map((match) => {
            const data = match.data || {};
            return {
                id: match._rowId,
                action_type: data.action_type,
                description: data.description,
                before_data: cleanData(data.before_data || {}),
                after_data: cleanData(data.after_data || {}),
                entity_id: data.entity_id,
                entity_name: data.entity_name,
                entity_type: data.entity_type,
                user_id: data.user_id || data.fields?.userId,
                username: data.username || data.fields?.username,
                role: data.role,
                user_agent: data.user_agent,
                created_at: data.timestamp || match._time,
            };
        });

        res.json({
            data: logs,
            pagination: { total_records: logs.length, total_pages: 1, current_page: 1 },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
};

module.exports = { getSignins, getAdminAuditLogs };
