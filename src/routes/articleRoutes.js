const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  getArticleStats,
  addComment,
} = require('../controllers/articleController');

router.get('/stats', getArticleStats);
router.get('/', getArticles);
router.get('/:id', getArticle);
router.post('/:id/comments', addComment);

router.post('/', protect, createArticle);
router.put('/:id', protect, updateArticle);
router.delete('/:id', protect, deleteArticle);

module.exports = router;