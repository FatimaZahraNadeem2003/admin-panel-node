const mongoose = require('mongoose');

const editionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Edition title is required'],
    trim: true,
  },
  volume: {
    type: String,
    required: [true, 'Volume is required'],
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  coverImage: {
    type: String,
    default: null,
  },
  articles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Article',
  }],
  articlesCount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Archived'],
    default: 'Draft',
  },
  publishedAt: {
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

module.exports = mongoose.model('Edition', editionSchema);