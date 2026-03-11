const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  type: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true,
  },
  metrics: {
    totalViews: {
      type: Number,
      default: 0,
    },
    uniqueVisitors: {
      type: Number,
      default: 0,
    },
    averageReadTime: {
      type: Number,
      default: 0,
    },
    bounceRate: {
      type: Number,
      default: 0,
    },
    totalArticles: {
      type: Number,
      default: 0,
    },
    publishedArticles: {
      type: Number,
      default: 0,
    },
    totalComments: {
      type: Number,
      default: 0,
    },
  },
  topArticles: [{
    articleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Article',
    },
    title: String,
    views: Number,
  }],
  categoryBreakdown: [{
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
    name: String,
    views: Number,
    percentage: Number,
  }],
  hourlyData: [{
    hour: Number,
    views: Number,
  }],
}, {
  timestamps: true,
});

analyticsSchema.index({ date: 1, type: 1 });

module.exports = mongoose.model('Analytics', analyticsSchema);