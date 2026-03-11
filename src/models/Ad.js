const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Ad name is required'],
    trim: true,
  },
  type: {
    type: String,
    enum: ['Banner', 'Sidebar', 'In-Article', 'Popup', 'Footer'],
    required: true,
  },
  position: {
    type: String,
    enum: ['Header', 'Sidebar', 'Article Body', 'Footer', 'Popup'],
    required: true,
  },
  code: {
    type: String,
    required: [true, 'Ad code is required'],
  },
  image: {
    type: String,
    default: null,
  },
  link: {
    type: String,
    default: null,
  },
  dimensions: {
    width: Number,
    height: Number,
  },
  status: {
    type: String,
    enum: ['Active', 'Paused', 'Draft', 'Expired'],
    default: 'Draft',
  },
  stats: {
    impressions: {
      type: Number,
      default: 0,
    },
    clicks: {
      type: Number,
      default: 0,
    },
    revenue: {
      type: Number,
      default: 0,
    },
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

adSchema.virstual('ctr').get(function() {
  if (this.stats.impressions === 0) return '0%';
  return ((this.stats.clicks / this.stats.impressions) * 100).toFixed(1) + '%';
});

module.exports = mongoose.model('Ad', adSchema);