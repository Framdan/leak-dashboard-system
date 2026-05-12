require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Node = require('../models/Node');

const seedAdmin = async () => {
  try {
    // 1. Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // 2. Check if admin already exists
    const adminEmail = 'admin@iot-water.com';
    const adminExists = await User.findOne({ email: adminEmail });

    if (adminExists) {
      console.log('Admin user already exists. Skipping...');
    } else {
      // 3. Hash password and create admin
      const hashedPassword = await bcrypt.hash('admin123', 10);

      await User.create({
        email: adminEmail,
        passwordHash: hashedPassword,
        role: 'admin'
      });

      console.log('Admin user seeded successfully');
    }

    // 4. Seed Nodes if none exist
    const nodeCount = await Node.countDocuments();
    if (nodeCount === 0) {
      await Node.insertMany([
        { name: "Node A", location: "Kigali Heights", maop: 40, pipeAge: 5, latitude: -1.9441, longitude: 30.0619 },
        { name: "Node B", location: "Nyamirambo", maop: 40, pipeAge: 8, latitude: -1.9706, longitude: 30.0397 },
        { name: "Node C", location: "Kacyiru", maop: 40, pipeAge: 3, latitude: -1.9355, longitude: 30.0928 }
      ]);
      console.log('Nodes seeded successfully');
    } else {
      console.log('Nodes already exist. Skipping node seeding...');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // 5. Disconnect
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  }
};

seedAdmin();
