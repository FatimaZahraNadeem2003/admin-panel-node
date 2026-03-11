const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getTags,
  getTag,
  createTag,
  updateTag,
  deleteTag,
  getPopularTags,
} = require('../controllers/tagController');

router.get('/popular', getPopularTags);
router.get('/', getTags);
router.get('/:id', getTag);

router.post('/', protect, authorize('Editor', 'Super Admin'), createTag);
router.put('/:id', protect, authorize('Editor', 'Super Admin'), updateTag);
router.delete('/:id', protect, authorize('Super Admin'), deleteTag);

module.exports = router;