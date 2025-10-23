const cron = require('node-cron');
const { deleteExpiredResetTokens } = require('../models/userModel');

// Function that starts the scheduled cleanup job
const startCleanupJob = () => {
  // Every day at midnight (00:00)
  cron.schedule('0 0 * * *', async () => {
    console.log('Running daily cleanup for expired password reset tokens...');
    try {
      await deleteExpiredResetTokens();
      console.log('Expired password reset tokens cleaned successfully');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  });

  console.log('Cleanup cron job scheduled to run daily at midnight.');
};

module.exports = { startCleanupJob };