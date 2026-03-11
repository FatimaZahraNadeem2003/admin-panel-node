const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryTree,
} = require('../controllers/categoryController');

router.get('/tree', getCategoryTree);
router.get('/', getCategories);
router.get('/:id', getCategory);

router.post('/', protect, authorize('Editor', 'Super Admin'), createCategory);
router.put('/:id', protect, authorize('Editor', 'Super Admin'), updateCategory);
router.delete('/:id', protect, authorize('Super Admin'), deleteCategory);

module.exports = router;