const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const { connectDB } = require('./config/db');
const { startCronJobs } = require('./services/cronService');
const emailEvents = require('./services/emailEvents');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100,
//   message: 'Too many requests from this IP, please try again later.'
// });
// app.use('/api/', limiter);

// CORS config
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'https://papaya-kitten-d5846f.netlify.app',
];

app.use(cors({
  origin(origin, callback) {
    // Allow REST clients or same-origin (no Origin header)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  // Include PATCH so preflight for toggle-active works
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-id']
}));

// Note: cors() middleware already handles preflight; no explicit app.options needed for Express 5


// Body parser
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

const emailRoutes = require('./routes/emailRoutes');
app.use('/api/emails', emailRoutes);

const followupRoutes = require('./routes/followupRoutes');
app.use('/api/admin/api/followup', followupRoutes);

// Catalog routes
const catalogRoutes = require('./routes/catalogRoutes');
app.use('/api/catalog', catalogRoutes);

// User management routes
const userRoutes = require('./routes/userRoutes');
app.use('/api/admin/users', userRoutes);

// Dashboard routes
const dashboardRoutes = require('./routes/dashboardRoutes');
app.use('/api/admin/dashboard', dashboardRoutes);

// Reporting routes
const reportingRoutes = require('./routes/reportingRoutes');
app.use('/api/admin/reports', reportingRoutes);

// Customer routes (CRUD + Excel upload)
const customerRoutes = require('./routes/customerRoutes');
app.use('/api/admin/customers', customerRoutes);

// Enquiry routes (list/create/update/convert)
const enquiryRoutes = require('./routes/enquiryRoutes');
app.use('/api/admin/enquiries', enquiryRoutes);

// Health check
app.get('/', (req, res) => {
  res.send('API Running...');
});

// SSE stream for email events
app.get('/api/emails/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders && res.flushHeaders();

  // Initial hello to establish stream
  res.write(`event: ping\n` + `data: "connected"\n\n`);

  emailEvents.addClient(res);

  // Heartbeat to keep the connection alive
  const interval = setInterval(() => {
    try {
      res.write(`event: ping\n` + `data: "keep-alive"\n\n`);
    } catch {
      clearInterval(interval);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(interval);
    emailEvents.removeClient(res);
  });
});

// Error handling middleware (must be last)
const { errorHandler } = require('./middleware/errorHandler');
app.use(errorHandler);

// ✅ Start server after DB connects
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
    
    // Start cron jobs for followup processing
    startCronJobs();
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
  }
};

startServer();
