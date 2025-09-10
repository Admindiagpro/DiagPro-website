import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';

// Import routes
import bookingsRoutes from './src/routes/bookings.js';
import servicesRoutes from './src/routes/services.js';
import customersRoutes from './src/routes/customers.js';
import assistantRoutes from './src/routes/assistant.js';
import paymentsRoutes from './src/routes/payments.js';

// Import middleware
import { errorHandler } from './src/middleware/errorHandler.js';
import { rtlSupport } from './src/middleware/rtlSupport.js';
import { requestLogger } from './src/middleware/requestLogger.js';

// Import config
import { connectDB } from './src/config/database.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize i18next for Arabic RTL support
i18next
  .use(Backend)
  .init({
    lng: 'ar',
    fallbackLng: 'en',
    debug: false,
    backend: {
      loadPath: './locales/{{lng}}/{{ns}}.json'
    },
    interpolation: {
      escapeValue: false
    }
  });

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    message_ar: 'طلبات كثيرة جداً من هذا العنوان، يرجى المحاولة لاحقاً.'
  }
});

app.use(limiter);

// CORS configuration for RTL and Arabic support
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language', 'X-RTL-Support'],
  credentials: true
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Custom middleware
app.use(requestLogger);
app.use(rtlSupport);

// Static files
app.use('/public', express.static('public'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    message: 'DiagPro API is running',
    message_ar: 'واجهة برمجة التطبيقات لمركز التشخيص الاحترافي تعمل بشكل طبيعي',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
app.use('/api/bookings', bookingsRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/payments', paymentsRoutes);

// Welcome endpoint with Arabic support
app.get('/', (req, res) => {
  const isArabic = req.headers['accept-language']?.includes('ar') || req.query.lang === 'ar';
  
  res.json({
    message: isArabic ? 
      'مرحباً بكم في واجهة برمجة التطبيقات لمركز التشخيص الاحترافي للسيارات' : 
      'Welcome to DiagPro Car Maintenance Center API',
    endpoints: {
      bookings: '/api/bookings',
      services: '/api/services', 
      customers: '/api/customers',
      assistant: '/api/assistant',
      payments: '/api/payments',
      health: '/health'
    },
    docs: '/docs',
    version: '1.0.0',
    rtl_support: true
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    error_ar: 'النقطة المطلوبة غير موجودة',
    path: req.originalUrl
  });
});

// Error handling middleware
app.use(errorHandler);

// Connect to database and start server
const startServer = async () => {
  try {
    // Comment out database connection for testing
    // await connectDB();
    
    app.listen(PORT, () => {
      console.log(`🚀 DiagPro API Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/docs`);
      console.log(`🔧 Health Check: http://localhost:${PORT}/health`);
      console.log(`🌐 RTL/Arabic Support: Enabled`);
      console.log(`⚠️  Database connection disabled for testing`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});