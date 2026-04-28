const cron = require('node-cron');
const prisma = require('../prisma');
const logger = require('../lib/logger');
const { aiQueue } = require('../lib/queue');

/**
 * Cleanup Service
 * Runs daily at midnight
 */
const initCleanupJobs = () => {
  cron.schedule('0 0 * * *', async () => {
    logger.info('Starting daily cleanup jobs...');

    try {
      // 1. Delete Failed Jobs older than 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      // Note: BullMQ failed jobs are handled via queue cleaning
      await aiQueue.clean(7 * 24 * 60 * 60 * 1000, 1000, 'failed');
      logger.info('Cleaned up failed queue jobs.');

      // 2. Delete Unused Media (orphaned entries or soft-deleted logic)
      // For this project, we'll delete media without a valid entryId
      const unusedMedia = await prisma.media.deleteMany({
        where: {
          entry: null,
          createdAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      });
      logger.info(`Deleted ${unusedMedia.count} unused media records.`);

      // 3. Archive/Cleanup old processed entries (Example: reset processing logs)
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      
      // In a real app, you'd move these to an archive table or cold storage
      logger.info('Archiving old AI logs (Simulation).');

    } catch (error) {
      logger.error('Cleanup Job Error:', error);
    }
  });

  logger.info('Scheduled Daily Cleanup Jobs.');
};

module.exports = initCleanupJobs;
