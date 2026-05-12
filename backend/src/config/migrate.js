require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Node = require('../models/Node');

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB...');

    // Migrate Users
    const users = await User.find({ password_hash: { $exists: true } });
    for (const user of users) {
      user.passwordHash = user.toObject().password_hash;
      user.set('password_hash', undefined, { strict: false });
      await user.save();
    }
    console.log(`Migrated ${users.length} users.`);

    // Migrate Nodes
    const nodes = await Node.find({ pipe_age: { $exists: true } });
    for (const node of nodes) {
      node.pipeAge = node.toObject().pipe_age;
      node.set('pipe_age', undefined, { strict: false });
      await node.save();
    }
    console.log(`Migrated ${nodes.length} nodes.`);

    console.log('Migration finished successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

migrate();
