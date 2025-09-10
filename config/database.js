const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const connectDB = async () => {
  try {
    // Use in-memory connection for demo if MongoDB isn't available
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/diagpro_db';
    
    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`.cyan?.underline || `MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`Database connection warning: ${error.message}`.yellow?.underline || `Database connection warning: ${error.message}`);
    console.log('Continuing without database connection for demonstration purposes'.yellow || 'Continuing without database connection for demonstration purposes');
    // Don't exit in demo mode, just continue without DB
  }
};

module.exports = connectDB;