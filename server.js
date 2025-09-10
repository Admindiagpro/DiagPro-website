const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const colors = require('colors');
const connectDB = require('./config/database');
const { seedServices } = require('./utils/seedData');

// Load environment variables
dotenv.config();

// Connect to database
connectDB().then(() => {
  // Seed initial data
  seedServices();
});

const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3001',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'DiagPro API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    status: 'healthy'
  });
});

// Routes
app.use('/api/customers', require('./routes/customers'));
app.use('/api/services', require('./routes/services'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/smart-assistant', require('./routes/smartAssistant'));

// Welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to DiagPro Car Maintenance Center API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      customers: '/api/customers',
      services: '/api/services',
      appointments: '/api/appointments',
      payments: '/api/payments',
      smartAssistant: '/api/smart-assistant'
    },
    documentation: 'See README.md for full API documentation'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Handle 404 - must be last
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`DiagPro API Server running on port ${PORT}`.yellow.bold);
  console.log(`Environment: ${process.env.NODE_ENV}`.green);
  console.log(`Health check: http://localhost:${PORT}/health`.cyan);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;