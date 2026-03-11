const Article = require('../models/Article');
const Category = require('../models/Category');
const Tag = require('../models/Tag');
const User = require('../models/User');
const Edition = require('../models/Edition');

// @desc    Get all articles
// @route   GET /api/articles
const getArticles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { status, category, author, search, sort } = req.query;

    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (author) query.author = author;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } },
      ];
    }

    let sortOption = '-createdAt';
    if (sort === 'views') sortOption = '-views';
    if (sort === 'title') sortOption = 'title';

    const articles = await Article.find(query)
      .populate('category', 'name slug')
      .populate('author', 'name email')
      .populate('tags', 'name color')
      .populate('edition', 'title volume')
      .skip(skip)
      .limit(limit)
      .sort(sortOption);

    const total = await Article.countDocuments(query);

    res.json({
      success: true,
      articles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get articles error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single article
// @route   GET /api/articles/:id
const getArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('author', 'name email')
      .populate('tags', 'name color')
      .populate('edition', 'title volume');

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    article.views += 1;
    await article.save();

    res.json({
      success: true,
      article,
    });
  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create article
// @route   POST /api/articles
const createArticle = async (req, res) => {
  try {
    const { title, summary, content, category, tags, edition, status, scheduledAt, seo } = req.body;

    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ message: 'Category not found' });
    }

    const article = await Article.create({
      title,
      summary,
      content,
      category,
      tags: tags || [],
      edition: edition || null,
      author: req.user.id,
      status: status || 'Draft',
      scheduledAt: scheduledAt || null,
      seo: seo || {},
    });

    categoryExists.articlesCount += 1;
    await categoryExists.save();

    if (tags && tags.length > 0) {
      await Tag.updateMany(
        { _id: { $in: tags } },
        { $inc: { articlesCount: 1 } }
      );
    }

    await User.findByIdAndUpdate(req.user.id, { $inc: { articlesCount: 1 } });

    if (edition) {
      await Edition.findByIdAndUpdate(edition, { 
        $inc: { articlesCount: 1 },
        $push: { articles: article._id }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Article created successfully',
      article,
    });
  } catch (error) {
    console.error('Create article error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update article
// @route   PUT /api/articles/:id
const updateArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    if (article.author.toString() !== req.user.id && req.user.role !== 'Super Admin' && req.user.role !== 'Editor') {
      return res.status(403).json({ message: 'Not authorized to update this article' });
    }

    const { title, summary, content, category, tags, edition, status, scheduledAt, seo } = req.body;

    article.title = title || article.title;
    article.summary = summary || article.summary;
    article.content = content || article.content;
    article.category = category || article.category;
    article.tags = tags || article.tags;
    article.edition = edition || article.edition;
    article.status = status || article.status;
    article.scheduledAt = scheduledAt || article.scheduledAt;
    article.seo = seo || article.seo;

    if (status === 'Published' && article.status !== 'Published') {
      article.publishedAt = new Date();
    }

    await article.save();

    res.json({
      success: true,
      message: 'Article updated successfully',
      article,
    });
  } catch (error) {
    console.error('Update article error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete article
// @route   DELETE /api/articles/:id
const deleteArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    if (article.author.toString() !== req.user.id && req.user.role !== 'Super Admin') {
      return res.status(403).json({ message: 'Not authorized to delete this article' });
    }

    await Category.findByIdAndUpdate(article.category, { $inc: { articlesCount: -1 } });

    if (article.tags && article.tags.length > 0) {
      await Tag.updateMany(
        { _id: { $in: article.tags } },
        { $inc: { articlesCount: -1 } }
      );
    }

    await User.findByIdAndUpdate(article.author, { $inc: { articlesCount: -1 } });

    if (article.edition) {
      await Edition.findByIdAndUpdate(article.edition, { $pull: { articles: article._id } });
    }

    await article.deleteOne();

    res.json({
      success: true,
      message: 'Article deleted successfully',
    });
  } catch (error) {
    console.error('Delete article error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get article stats
// @route   GET /api/articles/stats/summary
const getArticleStats = async (req, res) => {
  try {
    const total = await Article.countDocuments();
    const published = await Article.countDocuments({ status: 'Published' });
    const drafts = await Article.countDocuments({ status: 'Draft' });
    const underReview = await Article.countDocuments({ status: 'Under Review' });
    const archived = await Article.countDocuments({ status: 'Archived' });
    
    const totalViews = await Article.aggregate([
      { $group: { _id: null, total: { $sum: '$views' } } },
    ]);

    const categoryBreakdown = await Article.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
    ]);

    res.json({
      success: true,
      stats: {
        total,
        published,
        drafts,
        underReview,
        archived,
        totalViews: totalViews[0]?.total || 0,
        categoryBreakdown,
      },
    });
  } catch (error) {
    console.error('Get article stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Add comment to article
// @route   POST /api/articles/:id/comments
const addComment = async (req, res) => {
  try {
    const { name, email, content } = req.body;
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    const comment = {
      name,
      email,
      content,
      user: req.user?.id || null,
      createdAt: new Date(),
    };

    article.comments.push(comment);
    article.commentsCount += 1;
    await article.save();

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment,
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  getArticleStats,
  addComment,
};