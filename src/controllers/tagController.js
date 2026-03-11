const Tag = require('../models/Tag');

// @desc    Get all tags
// @route   GET /api/tags
const getTags = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const query = search
      ? { name: { $regex: search, $options: 'i' } }
      : {};

    const tags = await Tag.find(query)
      .populate('createdBy', 'name')
      .skip(skip)
      .limit(limit)
      .sort('-articlesCount');

    const total = await Tag.countDocuments(query);

    res.json({
      success: true,
      tags,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single tag
// @route   GET /api/tags/:id
const getTag = async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id)
      .populate('createdBy', 'name');

    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    res.json({
      success: true,
      tag,
    });
  } catch (error) {
    console.error('Get tag error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create tag
// @route   POST /api/tags
const createTag = async (req, res) => {
  try {
    const { name, color } = req.body;

    const tagExists = await Tag.findOne({ name });
    if (tagExists) {
      return res.status(400).json({ message: 'Tag already exists' });
    }

    const tag = await Tag.create({
      name,
      color: color || '#A68B5C',
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Tag created successfully',
      tag,
    });
  } catch (error) {
    console.error('Create tag error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update tag
// @route   PUT /api/tags/:id
const updateTag = async (req, res) => {
  try {
    const { name, color } = req.body;
    
    const tag = await Tag.findById(req.params.id);
    
    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    if (name && name !== tag.name) {
      const nameExists = await Tag.findOne({ name });
      if (nameExists) {
        return res.status(400).json({ message: 'Tag name already exists' });
      }
    }

    tag.name = name || tag.name;
    tag.color = color || tag.color;

    await tag.save();

    res.json({
      success: true,
      message: 'Tag updated successfully',
      tag,
    });
  } catch (error) {
    console.error('Update tag error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete tag
// @route   DELETE /api/tags/:id
const deleteTag = async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id);
    
    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    if (tag.articlesCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete tag with articles. Remove tag from articles first.' 
      });
    }

    await tag.deleteOne();

    res.json({
      success: true,
      message: 'Tag deleted successfully',
    });
  } catch (error) {
    console.error('Delete tag error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get popular tags
// @route   GET /api/tags/popular
const getPopularTags = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    
    const tags = await Tag.find()
      .sort('-articlesCount')
      .limit(limit);

    res.json({
      success: true,
      tags,
    });
  } catch (error) {
    console.error('Get popular tags error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getTags,
  getTag,
  createTag,
  updateTag,
  deleteTag,
  getPopularTags,
};