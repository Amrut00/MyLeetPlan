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

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    console.log(`📊 Database: ${mongoose.connection.name}`);
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error.message);
    if (error.message.includes('authentication failed')) {
      console.error('💡 Tip: Check your MongoDB username and password in the connection string');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.error('💡 Tip: Check your MongoDB cluster URL and network connectivity');
    }
    process.exit(1);
  });

// Routes
app.use('/api/problems', problemRoutes);
app.use('/api/daily', dailyRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/leetcode', leetcodeRoutes);
app.use('/api/practice-plan', practicePlanRoutes);
app.use('/api/recommendations', recommendationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

