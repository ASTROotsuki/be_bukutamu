const express = require('express');
const cors = ('cors');
const router = express();
const { getTotalVisitors, getWeeklyVisitors } = require('../controllers/dashboard_controller');

router.use(express.json());


router.get('/get', async (req, res) => {
    try {
        const totalVisitors = await getTotalVisitors();
        const weeklyVisitors = await getWeeklyVisitors();

        res.status(200).json({
            success: true,
            data: {
                totalVisitors,
                weeklyVisitors
            },
            message: 'Dashboard data retrived successfully'
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

module.exports = router;