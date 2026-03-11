const Edition = require('../models/Edition');
const Article = require('../models/Article');

// @desc    Get all editions
// @route   GET /api/editions
const getEditions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { status, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { volume: { $regex: search, $options: 'i' } },
      ];
    }

    const editions = await Edition.find(query)
      .populate('createdBy', 'name')
      .populate('articles', 'title slug')
      .skip(skip)
      .limit(limit)
      .sort('-createdAt');

    const total = await Edition.countDocuments(query);

    res.json({
      success: true,
      editions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get editions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single edition
// @route   GET /api/editions/:id
const getEdition = async (req, res) => {
  try {
    const edition = await Edition.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate({
        path: 'articles',
        populate: [
          { path: 'category', select: 'name' },
          { path: 'author', select: 'name' },
        ],
      });

    if (!edition) {
      return res.status(404).json({ message: 'Edition not found' });
    }

    res.json({
      success: true,
      edition,
    });
  } catch (error) {
    console.error('Get edition error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create edition
// @route   POST /api/editions
const createEdition = async (req, res) => {
  try {
    const { title, volume, description, coverImage, status } = req.body;

    const edition = await Edition.create({
      title,
      volume,
      description,
      coverImage,
      status: status || 'Draft',
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Edition created successfully',
      edition,
    });
  } catch (error) {
    console.error('Create edition error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update edition
// @route   PUT /api/editions/:id
const updateEdition = async (req, res) => {
  try {
    const { title, volume, description, coverImage, status } = req.body;
    
    const edition = await Edition.findById(req.params.id);
    
    if (!edition) {
      return res.status(404).json({ message: 'Edition not found' });
    }

    edition.title = title || edition.title;
    edition.volume = volume || edition.volume;
    edition.description = description || edition.description;
    edition.coverImage = coverImage || edition.coverImage;
    edition.status = status || edition.status;

    if (status === 'Published' && edition.status !== 'Published') {
      edition.publishedAt = new Date();
    }

    await edition.save();

    res.json({
      success: true,
      message: 'Edition updated successfully',
      edition,
    });
  } catch (error) {
    console.error('Update edition error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete edition
// @route   DELETE /api/editions/:id
const deleteEdition = async (req, res) => {
  try {
    const edition = await Edition.findById(req.params.id);
    
    if (!edition) {
      return res.status(404).json({ message: 'Edition not found' });
    }

    await Article.updateMany(
      { edition: edition._id },
      { $unset: { edition: 1 } }
    );

    await edition.deleteOne();

    res.json({
      success: true,
      message: 'Edition deleted successfully',
    });
  } catch (error) {
    console.error('Delete edition error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Add article to edition
// @route   POST /api/editions/:id/articles
const addArticleToEdition = async (req, res) => {
  try {
    const { articleId } = req.body;
    
    const edition = await Edition.findById(req.params.id);
    if (!edition) {
      return res.status(404).json({ message: 'Edition not found' });
    }

    const article = await Article.findById(articleId);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    if (edition.articles.includes(articleId)) {
      return res.status(400).json({ message: 'Article already in this edition' });
    }

    edition.articles.push(articleId);
    edition.articlesCount += 1;
    await edition.save();

    article.edition = edition._id;
    await article.save();

    res.json({
      success: true,
      message: 'Article added to edition',
      edition,
    });
  } catch (error) {
    console.error('Add article to edition error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Remove article from edition
// @route   DELETE /api/editions/:id/articles/:articleId
const removeArticleFromEdition = async (req, res) => {
  try {
    const edition = await Edition.findById(req.params.id);
    if (!edition) {
      return res.status(404).json({ message: 'Edition not found' });
    }

    edition.articles = edition.articles.filter(
      id => id.toString() !== req.params.articleId
    );
    edition.articlesCount -= 1;
    await edition.save();

    await Article.findByIdAndUpdate(req.params.articleId, { $unset: { edition: 1 } });

    res.json({
      success: true,
      message: 'Article removed from edition',
    });
  } catch (error) {
    console.error('Remove article from edition error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getEditions,
  getEdition,
  createEdition,
  updateEdition,
  deleteEdition,
  addArticleToEdition,
  removeArticleFromEdition,
};