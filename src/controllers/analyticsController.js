const Analytics = require('../models/Analytics');
const Article = require('../models/Article');
const Category = require('../models/Category');
const Ad = require('../models/Ad');

// @desc    Get dashboard overview
// @route   GET /api/analytics/overview
const getOverview = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const analytics = await Analytics.find({
      date: { $gte: thirtyDaysAgo },
      type: 'daily',
    }).sort('date');

    const totalArticles = await Article.countDocuments();
    const publishedArticles = await Article.countDocuments({ status: 'Published' });
    const draftArticles = await Article.countDocuments({ status: 'Draft' });

    const totalViews = await Article.aggregate([
      { $group: { _id: null, total: { $sum: '$views' } } },
    ]);

    const recentViews = await Article.aggregate([
      {
        $match: {
          updatedAt: { $gte: thirtyDaysAgo },
        },
      },
      { $group: { _id: null, total: { $sum: '$views' } } },
    ]);

    const activeAds = await Ad.countDocuments({ status: 'Active' });
    const adRevenue = await Ad.aggregate([
      { $group: { _id: null, total: { $sum: '$stats.revenue' } } },
    ]);

    const topCategories = await Category.find()
      .sort('-articlesCount')
      .limit(5)
      .select('name articlesCount');

    const topArticles = await Article.find({ status: 'Published' })
      .sort('-views')
      .limit(5)
      .populate('category', 'name')
      .select('title views uniqueViews category');

    res.json({
      success: true,
      overview: {
        articles: {
          total: totalArticles,
          published: publishedArticles,
          drafts: draftArticles,
        },
        views: {
          total: totalViews[0]?.total || 0,
          recent: recentViews[0]?.total || 0,
        },
        ads: {
          active: activeAds,
          revenue: adRevenue[0]?.total || 0,
        },
        topCategories,
        topArticles,
        chartData: analytics.map(a => ({
          date: a.date,
          views: a.metrics.totalViews,
          visitors: a.metrics.uniqueVisitors,
        })),
      },
    });
  } catch (error) {
    console.error('Get overview error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get traffic analytics
// @route   GET /api/analytics/traffic
const getTraffic = async (req, res) => {
  try {
    const { period = '30days' } = req.query;

    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    switch (period) {
      case '7days':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    const analytics = await Analytics.find({
      date: { $gte: startDate },
      type: 'daily',
    }).sort('date');

    const summary = analytics.reduce(
      (acc, curr) => {
        acc.totalViews += curr.metrics.totalViews;
        acc.totalVisitors += curr.metrics.uniqueVisitors;
        acc.totalReadTime += curr.metrics.averageReadTime * curr.metrics.uniqueVisitors;
        acc.totalBounceRate += curr.metrics.bounceRate;
        return acc;
      },
      { totalViews: 0, totalVisitors: 0, totalReadTime: 0, totalBounceRate: 0 }
    );

    const avgBounceRate = analytics.length > 0 
      ? summary.totalBounceRate / analytics.length 
      : 0;

    const todayAnalytics = analytics.find(a => {
      const aDate = new Date(a.date);
      const today = new Date();
      return aDate.toDateString() === today.toDateString();
    });

    res.json({
      success: true,
      traffic: {
        summary: {
          totalViews: summary.totalViews,
          totalVisitors: summary.totalVisitors,
          avgReadTime: Math.round(summary.totalReadTime / summary.totalVisitors) || 0,
          avgBounceRate: Math.round(avgBounceRate * 10) / 10,
        },
        chartData: analytics.map(a => ({
          date: a.date,
          views: a.metrics.totalViews,
          visitors: a.metrics.uniqueVisitors,
          readTime: a.metrics.averageReadTime,
        })),
        hourlyData: todayAnalytics?.hourlyData || [],
      },
    });
  } catch (error) {
    console.error('Get traffic error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get content performance
// @route   GET /api/analytics/content
const getContentPerformance = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const topArticles = await Article.find({ status: 'Published' })
      .sort('-views')
      .limit(parseInt(limit))
      .populate('category', 'name')
      .populate('author', 'name')
      .select('title views uniqueViews readTime commentsCount category author publishedAt');

    const categoryPerformance = await Category.aggregate([
      {
        $lookup: {
          from: 'articles',
          localField: '_id',
          foreignField: 'category',
          as: 'articles',
        },
      },
      {
        $project: {
          name: 1,
          articlesCount: { $size: '$articles' },
          totalViews: { $sum: '$articles.views' },
        },
      },
      { $sort: { totalViews: -1 } },
    ]);

    const tagPerformance = await Article.aggregate([
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          articlesCount: { $sum: 1 },
          totalViews: { $sum: '$views' },
        },
      },
      { $sort: { totalViews: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'tags',
          localField: '_id',
          foreignField: '_id',
          as: 'tag',
        },
      },
    ]);

    res.json({
      success: true,
      content: {
        topArticles,
        categoryPerformance,
        tagPerformance: tagPerformance.map(t => ({
          ...t,
          name: t.tag[0]?.name,
          color: t.tag[0]?.color,
        })),
      },
    });
  } catch (error) {
    console.error('Get content performance error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get realtime stats
// @route   GET /api/analytics/realtime
const getRealtimeStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let todayAnalytics = await Analytics.findOne({
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    if (!todayAnalytics) {
      todayAnalytics = {
        metrics: {
          totalViews: 0,
          uniqueVisitors: 0,
        },
        hourlyData: [],
      };
    }

    const currentHour = new Date().getHours();
    const currentHourData = todayAnalytics.hourlyData?.find(h => h.hour === currentHour);

    const recentArticles = await Article.find({
      updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    })
      .sort('-updatedAt')
      .limit(5)
      .select('title views status');

    res.json({
      success: true,
      realtime: {
        todayViews: todayAnalytics.metrics.totalViews,
        todayVisitors: todayAnalytics.metrics.uniqueVisitors,
        currentHourViews: currentHourData?.views || 0,
        recentArticles,
      },
    });
  } catch (error) {
    console.error('Get realtime stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getOverview,
  getTraffic,
  getContentPerformance,
  getRealtimeStats,
};