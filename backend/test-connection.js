const mongoose = require('mongoose');
const { connectDB } = require('./config/db');
const emailConfig = require('./config/emailConfig');
const logger = require('./utils/logger');

async function testConnections() {
  console.log('🔍 Testing connections...\n');

  // Test environment variables
  console.log('📋 Environment Variables:');
  console.log('MONGO_URI:', process.env.MONGO_URI ? 'Set' : 'Not set');
  console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not set');
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'Not set');
  console.log('');

  // Test database connection
  console.log('🗄️  Testing Database Connection:');
  try {
    await connectDB();
    console.log('✅ Database connection successful');
    
    // Test a simple query
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📊 Available collections:', collections.map(c => c.name));
    
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
  }
  console.log('');

  // Test email configuration
  console.log('📧 Testing Email Configuration:');
  console.log('Email User:', emailConfig.user ? 'Set' : 'Not set');
  console.log('Email Password:', emailConfig.password ? 'Set' : 'Not set');
  console.log('IMAP Host:', emailConfig.imapHost);
  console.log('SMTP Host:', emailConfig.smtpHost);
  console.log('');

  // Test campaign model
  console.log('📝 Testing Campaign Model:');
  try {
    const Campaign = require('./models/follow-up/Campaign');
    console.log('✅ Campaign model loaded successfully');
    
    // Test template model
    const Template = require('./models/follow-up/Template');
    console.log('✅ Template model loaded successfully');
    
    // Test contact model
    const Contact = require('./models/follow-up/Contact');
    console.log('✅ Contact model loaded successfully');
    
  } catch (error) {
    console.log('❌ Model loading failed:', error.message);
  }
  console.log('');

  console.log('🏁 Connection test completed');
  process.exit(0);
}

testConnections().catch(console.error); 