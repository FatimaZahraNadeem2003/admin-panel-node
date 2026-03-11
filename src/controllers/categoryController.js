const Category = require('../models/Category');

// @desc    Get all categories
// @route   GET /api/categories
const getCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const query = search
      ? { name: { $regex: search, $options: 'i' } }
      : {};

    const categories = await Category.find(query)
      .populate('parent', 'name')
      .populate('createdBy', 'name')
      .skip(skip)
      .limit(limit)
      .sort('order name');

    const total = await Category.countDocuments(query);

    res.json({
      success: true,
      categories,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single category
// @route   GET /api/categories/:id
const getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('parent', 'name')
      .populate('createdBy', 'name');

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({
      success: true,
      category,
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create category
// @route   POST /api/categories
const createCategory = async (req, res) => {
  try {
    const { name, description, parent, order } = req.body;

    const categoryExists = await Category.findOne({ name });
    if (categoryExists) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = await Category.create({
      name,
      description,
      parent: parent || null,
      order: order || 0,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category,
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
const updateCategory = async (req, res) => {
  try {
    const { name, description, parent, order, isActive } = req.body;
    
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (name && name !== category.name) {
      const nameExists = await Category.findOne({ name });
      if (nameExists) {
        return res.status(400).json({ message: 'Category name already exists' });
      }
    }

    category.name = name || category.name;
    category.description = description || category.description;
    category.parent = parent || category.parent;
    category.order = order !== undefined ? order : category.order;
    category.isActive = isActive !== undefined ? isActive : category.isActive;

    await category.save();

    res.json({
      success: true,
      message: 'Category updated successfully',
      category,
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (category.articlesCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete category with articles. Move or delete articles first.' 
      });
    }

    const hasSubcategories = await Category.findOne({ parent: category._id });
    if (hasSubcategories) {
      return res.status(400).json({ 
        message: 'Cannot delete category with subcategories. Delete subcategories first.' 
      });
    }

    await category.deleteOne();

    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get category tree
// @route   GET /api/categories/tree
const getCategoryTree = async (req, res) => {
  try {
    const categories = await Category.find().sort('order name');
    
    const buildTree = (parentId = null) => {
      return categories
        .filter(c => (c.parent ? c.parent.toString() : null) === parentId)
        .map(c => ({
          ...c.toObject(),
          children: buildTree(c._id.toString()),
        }));
    };

    const tree = buildTree();

    res.json({
      success: true,
      tree,
    });
  } catch (error) {
    console.error('Get category tree error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryTree,
};