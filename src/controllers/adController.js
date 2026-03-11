const Ad = require('../models/Ad');

// @desc    Get all ads
// @route   GET /api/ads
const getAds = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { status, position, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (position) query.position = position;
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const ads = await Ad.find(query)
      .populate('createdBy', 'name')
      .skip(skip)
      .limit(limit)
      .sort('-createdAt');

    const total = await Ad.countDocuments(query);

    res.json({
      success: true,
      ads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get ads error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single ad
// @route   GET /api/ads/:id
const getAd = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id)
      .populate('createdBy', 'name');

    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    res.json({
      success: true,
      ad,
    });
  } catch (error) {
    console.error('Get ad error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create ad
// @route   POST /api/ads
const createAd = async (req, res) => {
  try {
    const { name, type, position, code, image, link, dimensions, startDate, endDate } = req.body;

    const ad = await Ad.create({
      name,
      type,
      position,
      code,
      image,
      link,
      dimensions,
      startDate: startDate || new Date(),
      endDate,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Ad created successfully',
      ad,
    });
  } catch (error) {
    console.error('Create ad error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update ad
// @route   PUT /api/ads/:id
const updateAd = async (req, res) => {
  try {
    const { name, type, position, code, image, link, dimensions, status, startDate, endDate } = req.body;
    
    const ad = await Ad.findById(req.params.id);
    
    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    ad.name = name || ad.name;
    ad.type = type || ad.type;
    ad.position = position || ad.position;
    ad.code = code || ad.code;
    ad.image = image || ad.image;
    ad.link = link || ad.link;
    ad.dimensions = dimensions || ad.dimensions;
    ad.status = status || ad.status;
    ad.startDate = startDate || ad.startDate;
    ad.endDate = endDate !== undefined ? endDate : ad.endDate;

    await ad.save();

    res.json({
      success: true,
      message: 'Ad updated successfully',
      ad,
    });
  } catch (error) {
    console.error('Update ad error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete ad
// @route   DELETE /api/ads/:id
const deleteAd = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);
    
    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    await ad.deleteOne();

    res.json({
      success: true,
      message: 'Ad deleted successfully',
    });
  } catch (error) {
    console.error('Delete ad error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Track ad impression
// @route   POST /api/ads/:id/impression
const trackImpression = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);
    
    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    ad.stats.impressions += 1;
    await ad.save();

    res.json({
      success: true,
      message: 'Impression tracked',
    });
  } catch (error) {
    console.error('Track impression error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Track ad click
// @route   POST /api/ads/:id/click
const trackClick = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);
    
    if (!ad) {
      return res.status(404).json({ message: 'Ad not found' });
    }

    ad.stats.clicks += 1;
    await ad.save();

    res.json({
      success: true,
      message: 'Click tracked',
    });
  } catch (error) {
    console.error('Track click error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get ad stats
// @route   GET /api/ads/stats/summary
const getAdStats = async (req, res) => {
  try {
    const total = await Ad.countDocuments();
    const active = await Ad.countDocuments({ status: 'Active' });
    
    const totalImpressions = await Ad.aggregate([
      { $group: { _id: null, total: { $sum: '$stats.impressions' } } },
    ]);

    const totalClicks = await Ad.aggregate([
      { $group: { _id: null, total: { $sum: '$stats.clicks' } } },
    ]);

    const totalRevenue = await Ad.aggregate([
      { $group: { _id: null, total: { $sum: '$stats.revenue' } } },
    ]);

    res.json({
      success: true,
      stats: {
        total,
        active,
        totalImpressions: totalImpressions[0]?.total || 0,
        totalClicks: totalClicks[0]?.total || 0,
        totalRevenue: totalRevenue[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error('Get ad stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAds,
  getAd,
  createAd,
  updateAd,
  deleteAd,
  trackImpression,
  trackClick,
  getAdStats,
};