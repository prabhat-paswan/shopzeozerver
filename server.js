const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Import middleware
const { requestLogger, errorHandler } = require('./middleware/auth');

// Import routes
const authRoutes = require('./routes/auth');
const storeRoutes = require('./routes/stores');
const categoryRoutes = require('./routes/categories');
const subCategoryRoutes = require('./routes/subCategoryRoutes');
const productRoutes = require('./routes/products');
const brandRoutes = require('./routes/brands');
const bannerRoutes = require('./routes/banners');

// Import database and models
const { sequelize } = require('./config/database');
require('./models/index'); // This ensures associations are set up

// Create Express app
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.use(requestLogger);

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Shopzeo API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/subcategories', subCategoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/banners', bannerRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Shopzeo Multivendor eCommerce API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      stores: '/api/stores',
      categories: '/api/categories',
      subcategories: '/api/subcategories',
      products: '/api/products',
      brands: '/api/brands',
      banners: '/api/banners'
    },
    documentation: '/api/docs'
  });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handling middleware
app.use(errorHandler);

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    sequelize.close();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    sequelize.close();
    process.exit(0);
  });
});

// Unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  server.close(() => {
    console.log('Process terminated due to unhandled promise rejection');
    sequelize.close();
    process.exit(1);
  });
});

// Uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  server.close(() => {
    console.log('Process terminated due to uncaught exception');
    sequelize.close();
    process.exit(1);
  });
});

// Database connection and server startup
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');

    // Sync database models (in production, use migrations instead)
    // Temporarily disabled due to database constraint issues
    // if (process.env.NODE_ENV === 'development') {
    //   await sequelize.sync({ alter: true });
    //   console.log('✅ Database models synchronized');
    // }

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Store server reference for graceful shutdown
    global.server = server;

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
