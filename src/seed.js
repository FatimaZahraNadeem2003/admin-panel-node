const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') }); 

const User = require('./models/User');
const Category = require('./models/Category');
const Tag = require('./models/Tag');
// Import Edition if needed
// const Edition = require('./models/Edition');

const seedDatabase = async () => {
  try {
    console.log('MONGODB_URI:', process.env.MONGODB_URI); 
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in .env file');
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
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

    console.log('Admin created:', admin.email);

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

    console.log('Categories created:', categories.length);

    const tags = await Tag.create([
      { name: 'Halal Economy', color: '#A68B5C', createdBy: admin._id },
      { name: 'Finance', color: '#3D8F6F', createdBy: admin._id },
      { name: 'Technology', color: '#4A90E2', createdBy: admin._id },
      { name: 'Sustainability', color: '#50C878', createdBy: admin._id },
      { name: 'Islamic Finance', color: '#9B59B6', createdBy: admin._id },
    ]);

    console.log('Tags created:', tags.length);

    console.log('\n✅ Database seeded successfully!');
    console.log('📧 Admin credentials:');
    console.log('   Email: admin@emaanmall.com');
    console.log('   Password: admin123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
};

seedDatabase();