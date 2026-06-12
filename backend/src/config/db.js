const mongoose = require('mongoose');

const seedDatabaseInline = async () => {
  const User = require('../models/User');
  const Node = require('../models/Node');
  const Settings = require('../models/Settings');
  const bcrypt = require('bcrypt');

  try {
    // 1. Initialize settings singleton
    await Settings.getSingleton();
    
    // 2. Check and seed admin user
    const adminEmail = 'admin@iot-water.com';
    const adminExists = await User.findOne({ email: adminEmail });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        email: adminEmail,
        passwordHash: hashedPassword,
        role: 'admin'
      });
      console.log('Database Seeding: Admin user seeded successfully (admin@iot-water.com / admin123).');
    }
    
    // 3. Check and seed default pipeline nodes
    const nodeCount = await Node.countDocuments();
    if (nodeCount === 0) {
      await Node.insertMany([
        { name: "Node A", location: "Kigali Heights", maop: 40, pipeAge: 5, latitude: -1.9441, longitude: 30.0619 },
        { name: "Node B", location: "Nyamirambo", maop: 40, pipeAge: 8, latitude: -1.9706, longitude: 30.0397 },
        { name: "Node C", location: "Kacyiru", maop: 40, pipeAge: 3, latitude: -1.9355, longitude: 30.0928 }
      ]);
      console.log('Database Seeding: Simulation nodes seeded successfully.');
    }
  } catch (err) {
    console.error('Database Seeding: Warning - Auto-seeding check failed:', err.message);
  }
};

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;
    let isMemoryDb = false;

    // If local URI is specified, try connecting. If it fails, fall back to MongoMemoryServer
    if (!uri || uri.includes('localhost') || uri.includes('127.0.0.1') || uri.includes('::1')) {
      try {
        console.log('Attempting to connect to local MongoDB database...');
        const conn = await mongoose.connect(uri || 'mongodb://127.0.0.1:27017/leak_dashboard', {
          serverSelectionTimeoutMS: 2000 // Timeout quickly (2 seconds) if MongoDB is not running
        });
        console.log(`MongoDB Connected (Local): ${conn.connection.host}`);
        await seedDatabaseInline();
        return;
      } catch (err) {
        console.log('Local MongoDB not running. Spawning an In-Memory MongoDB Server...');
        try {
          const { MongoMemoryServer } = require('mongodb-memory-server');
          const mongoServer = await MongoMemoryServer.create({
            binary: {
              version: '4.0.28'
            }
          });
          uri = mongoServer.getUri();
          isMemoryDb = true;
          global.mongoServer = mongoServer;
          console.log(`In-Memory MongoDB Server spawned successfully.`);
        } catch (memError) {
          console.error('Error spawning In-Memory MongoDB Server:', memError.message);
          throw err; // Throw the original connection error if memory server fails
        }
      }
    }

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected ${isMemoryDb ? '(In-Memory)' : ''}: ${conn.connection.host}`);
    
    // Auto-seed database if it is empty
    await seedDatabaseInline();

  } catch (error) {
    console.error(`Database connection failed: ${error.message}`);
    console.log('--------------------------------------------------');
    console.log('TROUBLESHOOTING GUIDE:');
    console.log('1. Make sure MongoDB is installed and running locally.');
    console.log('2. Or, configure MONGODB_URI in backend/.env to use MongoDB Atlas (Cloud).');
    console.log('3. If using in-memory mode, connect to the internet to download the database binary on first run.');
    console.log('--------------------------------------------------');
    process.exit(1);
  }
};

module.exports = connectDB;
