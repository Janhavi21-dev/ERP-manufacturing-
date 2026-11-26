import dotenv from 'dotenv';
dotenv.config();

import { connectDB, disconnectDB } from '../src/config/db.js';
import mongoose from 'mongoose';

const resetDatabase = async () => {
  if (process.env.NODE_ENV === 'production') {
    console.error('⛔ FATAL: Cannot run database reset in production mode!');
    process.exit(1);
  }

  try {
    console.log('⚠️ Connecting to database for reset...');
    await connectDB();

    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
      console.log(`🧹 Emptied collection: ${collection.collectionName}`);
    }

    console.log('✅ Database reset completed successfully.');
  } catch (error) {
    console.error('❌ Reset error:', error);
  } finally {
    await disconnectDB();
  }
};

resetDatabase();
