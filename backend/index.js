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
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-id']
}));


// Body parser
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
