const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getOverview,
  getTraffic,
  getContentPerformance,
  getRealtimeStats,
} = require('../controllers/analyticsController');

router.use(protect);
router.use(authorize('Editor', 'Super Admin'));

router.get('/overview', getOverview);
router.get('/traffic', getTraffic);
router.get('/content', getContentPerformance);
router.get('/realtime', getRealtimeStats);

module.exports = router;