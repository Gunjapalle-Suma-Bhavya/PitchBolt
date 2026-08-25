const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/ai_telephony_sales',
      { serverSelectionTimeoutMS: 1500 }
    );
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log('[MongoDB Warning] Operating in-memory mode (Local MongoDB server offline).');
    mongoose.set('bufferCommands', false);
  }
};

module.exports = connectDB;
