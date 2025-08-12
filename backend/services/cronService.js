const cron = require('node-cron')
const followupService = require('./followupService')
const logger = require('../utils/logger')

// Process scheduled followups every 5 minutes
const processScheduledFollowups = cron.schedule('*/5 * * * *', async () => {
  try {
    logger.info('Starting scheduled followup processing...')
    await followupService.processScheduledFollowups()
    logger.info('Scheduled followup processing completed')
  } catch (error) {
    logger.error('Error processing scheduled followups:', error)
  }
}, {
  scheduled: false // Don't start automatically
})

// Process scheduled campaigns every minute
const processScheduledCampaigns = cron.schedule('* * * * *', async () => {
  try {
    logger.info('Starting scheduled campaign processing...')
    await followupService.processScheduledCampaigns()
    logger.info('Scheduled campaign processing completed')
  } catch (error) {
    logger.error('Error processing scheduled campaigns:', error)
  }
}, {
  scheduled: false
})

// Process due queued emails (sequence items) every minute
const processDueEmails = cron.schedule('* * * * *', async () => {
  try {
    logger.info('Starting due email processing...')
    await followupService.processDueEmails()
    logger.info('Due email processing completed')
  } catch (error) {
    logger.error('Error processing due emails:', error)
  }
}, {
  scheduled: false
})

// Start the cron job
function startCronJobs() {
  processScheduledFollowups.start()
  processScheduledCampaigns.start()
  processDueEmails.start()
  logger.info('Cron jobs started')
}

// Stop the cron job
function stopCronJobs() {
  processScheduledFollowups.stop()
  processScheduledCampaigns.stop()
  processDueEmails.stop()
  logger.info('Cron jobs stopped')
}

module.exports = {
  startCronJobs,
  stopCronJobs
}