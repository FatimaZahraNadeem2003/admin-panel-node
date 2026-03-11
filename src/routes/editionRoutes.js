const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getEditions,
  getEdition,
  createEdition,
  updateEdition,
  deleteEdition,
  addArticleToEdition,
  removeArticleFromEdition,
} = require('../controllers/editionController');

router.get('/', getEditions);
router.get('/:id', getEdition);

router.post('/', protect, authorize('Editor', 'Super Admin'), createEdition);
router.put('/:id', protect, authorize('Editor', 'Super Admin'), updateEdition);
router.delete('/:id', protect, authorize('Super Admin'), deleteEdition);
router.post('/:id/articles', protect, authorize('Editor', 'Super Admin'), addArticleToEdition);
router.delete('/:id/articles/:articleId', protect, authorize('Editor', 'Super Admin'), removeArticleFromEdition);

module.exports = router;