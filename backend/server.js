import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import problemRoutes from './routes/problems.js';
import dailyRoutes from './routes/daily.js';
import statsRoutes from './routes/stats.js';
import leetcodeRoutes from './routes/leetcode.js';
import practicePlanRoutes from './routes/practicePlan.js';
import recommendationRoutes from './routes/recommendations.js';

dotenv.config();

// Global error handlers to prevent server crashes
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Don't exit the process, just log the error
  // In production, you might want to exit and let a process manager restart it
});

// Validate required environment variables
if (!process.env.MONGODB_URI) {
  console.error('❌ ERROR: MONGODB_URI is not defined in .env file');
  console.error('Please create a .env file in the backend directory with your MongoDB connection string.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const NODE_ENV = process.env.NODE_ENV || 'development';

// CORS configuration - allow Vercel preview deployments and production
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  FRONTEND_URL
];

// Add Vercel preview URL pattern if FRONTEND_URL is a Vercel URL
if (FRONTEND_URL.includes('vercel.app')) {
  // Extract base domain (e.g., 'my-leet-plan.vercel.app')
  const baseDomain = FRONTEND_URL.replace(/^https?:\/\//, '').split('.vercel.app')[0] + '.vercel.app';
  // Allow production URL
  if (!allowedOrigins.includes(`https://${baseDomain}`)) {
    allowedOrigins.push(`https://${baseDomain}`);
  }
}

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow Vercel preview deployments (pattern: https://*-*.vercel.app)
    if (origin.includes('.vercel.app')) {
      return callback(null, true);
    }
    
    // Reject other origins
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());

// MongoDB: disable buffering so queries fail fast if not connected
mongoose.set('bufferCommands', false);

// MongoDB connection options for better stability
const mongooseOptions = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000, // Increased timeout
  family: 4,
  maxPoolSize: 10, // Maintain up to 10 socket connections
  minPoolSize: 2, // Maintain at least 2 socket connections
  maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
  heartbeatFrequencyMS: 10000, // Check connection health every 10 seconds
};

let isDbReady = false;

async function start() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, mongooseOptions);
    isDbReady = true;
    console.log('✅ Connected to MongoDB Atlas');
    console.log(`📊 Database: ${mongoose.connection.name}`);

    // Routes
    app.use('/api/problems', problemRoutes);
    app.use('/api/daily', dailyRoutes);
    app.use('/api/stats', statsRoutes);
    app.use('/api/leetcode', leetcodeRoutes);
    app.use('/api/practice-plan', practicePlanRoutes);
    app.use('/api/recommendations', recommendationRoutes);

    // Health check (reports DB readiness)
    app.get('/api/health', (req, res) => {
      const state = mongoose.connection.readyState; // 1=connected
      res.status(isDbReady ? 200 : 503).json({
        status: isDbReady ? 'OK' : 'STARTING',
        db: state === 1 ? 'connected' : 'not-connected'
      });
    });

    // Global error handler middleware (must be last)
    app.use((err, req, res, next) => {
      console.error('❌ Express Error:', err);
      res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(NODE_ENV === 'development' && { stack: err.stack })
      });
    });

    // Handle 404 for API routes (must be after all other routes)
    app.use((req, res) => {
      if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: 'API endpoint not found' });
      } else {
        res.status(404).json({ error: 'Not found' });
      }
    });

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    // Handle MongoDB connection errors
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
      isDbReady = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
      isDbReady = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
      isDbReady = true;
    });
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    if (error.message.includes('authentication failed')) {
      console.error('💡 Tip: Check your MongoDB username and password in the connection string');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.error('💡 Tip: Check your MongoDB cluster URL and network connectivity');
    }
    process.exit(1);
  }
}

start();

