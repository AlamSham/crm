const mongoose = require('mongoose');
const { connectDB } = require('./config/db');
const emailConfig = require('./config/emailConfig');
const logger = require('./utils/logger');
const Campaign = require('./models/follow-up/Campaign');
const Contact = require('./models/follow-up/Contact');
const Template = require('./models/follow-up/Template');

async function testCampaign() {
  console.log('🔍 Testing campaign and email configuration...\n');

  try {
    // Connect to database
    await connectDB();
    console.log('✅ Database connected');

    // Check email configuration
    console.log('\n📧 Email Configuration:');
    console.log('Email User:', emailConfig.user ? 'Set' : 'Not set');
    console.log('Email Password:', emailConfig.password ? 'Set' : 'Not set');
    console.log('SMTP Host:', emailConfig.smtpHost);
    console.log('SMTP Port:', emailConfig.smtpPort);

    if (!emailConfig.user || !emailConfig.password) {
      console.log('❌ Email configuration is missing!');
      console.log('Please check your .env file for EMAIL_USER and EMAIL_PASS');
      return;
    }

    // Find the latest campaign
    const campaign = await Campaign.findOne().sort({ createdAt: -1 });
    if (!campaign) {
      console.log('❌ No campaigns found');
      return;
    }

    console.log('\n📝 Latest Campaign:');
    console.log('ID:', campaign._id);
    console.log('Name:', campaign.name);
    console.log('Status:', campaign.status);
    console.log('Send Type:', campaign.sendType);
    console.log('Created:', campaign.createdAt);

    // Check contacts
    const contactCount = await Contact.countDocuments({ _id: { $in: campaign.contacts } });
    console.log('Direct Contacts:', contactCount);

    // Check contact lists
    if (campaign.contactLists && campaign.contactLists.length > 0) {
      console.log('Contact Lists:', campaign.contactLists.length);
    }

    // Check template
    const template = await Template.findById(campaign.template);
    if (template) {
      console.log('Template:', template.name);
      console.log('Subject:', template.subject);
    }

    console.log('\n🚀 To start the campaign, use this API call:');
    console.log(`POST /api/campaigns/${campaign._id}/start`);
    console.log('Headers: x-admin-id: YOUR_USER_ID');
    console.log('Body: {}');

    console.log('\n📊 Campaign Status Check:');
    if (campaign.status === 'draft') {
      console.log('✅ Campaign is ready to start');
    } else if (campaign.status === 'sending') {
      console.log('⏳ Campaign is currently sending');
    } else if (campaign.status === 'sent') {
      console.log('✅ Campaign has been sent');
    } else {
      console.log('ℹ️  Campaign status:', campaign.status);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

testCampaign().catch(console.error); 