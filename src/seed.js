const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Category = require('./models/Category');
const Tag = require('./models/Tag');

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await User.deleteMany({});
    await Category.deleteMany({});
    await Tag.deleteMany({});

    const admin = await User.create({
      name: 'Super Admin',
      email: 'admin@emaanmall.com',
      password: 'admin123',
      role: 'Super Admin',
      permissions: ['full_access'],
      status: 'Active',
    });

    const categories = await Category.create([
      {
        name: 'Economics',
        description: 'Articles about economics and finance',
        createdBy: admin._id,
      },
      {
        name: 'Politics',
        description: 'Political analysis and news',
        createdBy: admin._id,
      },
      {
        name: 'Technology',
        description: 'Tech trends and innovations',
        createdBy: admin._id,
      },
      {
        name: 'Environment',
        description: 'Environmental issues and solutions',
        createdBy: admin._id,
      },
    ]);

    const tags = await Tag.create([
      { name: 'Halal Economy', color: '#A68B5C', createdBy: admin._id },
      { name: 'Finance', color: '#3D8F6F', createdBy: admin._id },
      { name: 'Technology', color: '#4A90E2', createdBy: admin._id },
      { name: 'Sustainability', color: '#50C878', createdBy: admin._id },
      { name: 'Islamic Finance', color: '#9B59B6', createdBy: admin._id },
    ]);

    console.log('Database seeded successfully!');
    console.log('Admin credentials:');
    console.log('Email: admin@emaanmall.com');
    console.log('Password: admin123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();