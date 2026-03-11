const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAds,
  getAd,
  createAd,
  updateAd,
  deleteAd,
  trackImpression,
  trackClick,
  getAdStats,
} = require('../controllers/adController');

router.post('/:id/impression', trackImpression);
router.post('/:id/click', trackClick);

router.get('/stats', protect, authorize('Super Admin'), getAdStats);
router.get('/', protect, authorize('Editor', 'Super Admin'), getAds);
router.get('/:id', protect, authorize('Editor', 'Super Admin'), getAd);
router.post('/', protect, authorize('Super Admin'), createAd);
router.put('/:id', protect, authorize('Super Admin'), updateAd);
router.delete('/:id', protect, authorize('Super Admin'), deleteAd);

module.exports = router;