const express = require('express');
const axios = require('axios');
const router = express.Router();

const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

router.get('/signins', async (req, res) => {
    try {
        const dataset = process.env.AXIOM_DATASET;
        const token = process.env.AXIOM_TOKEN;

        if (!dataset || !token) {
            return res.status(500).json({ error: 'AXIOM_DATASET or AXIOM_TOKEN not defined' });
        }

        // Match exact login messages
        const response = await axios.post(
            `https://cloud.axiom.co/api/v1/datasets/_apl?format=tabular`,
            {
                apl: `['${dataset}'] | where message =~ "login"`, // ← APL query with dataset name
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

        console.log('Matches count:', response.data.matches?.length);

        res.json(response.data.matches || []);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

module.exports = router;
