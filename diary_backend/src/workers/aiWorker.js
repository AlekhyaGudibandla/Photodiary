const { Worker } = require('bullmq');
const { connection, aiQueue } = require('../lib/queue');
const prisma = require('../prisma');
const { analyzeDiaryEntry } = require('../services/aiService');
const { getIO } = require('../lib/socket');
const logger = require('../lib/logger');

const initAIWorker = () => {
  const worker = new Worker(
    'ai-processing',
    async (job) => {
      const { entryId } = job.data;
      logger.info(`Processing job ${job.id} for entry ${entryId}`, { jobId: job.id, entryId });

      try {
        const entry = await prisma.entry.findUnique({
          where: { id: entryId },
          include: { media: true },
        });

        if (!entry) throw new Error(`Entry ${entryId} not found`);

        await prisma.entry.update({
          where: { id: entryId },
          data: { processingStatus: 'PROCESSING' },
        });

        const aiResult = await analyzeDiaryEntry(entry.content, entry.media);

        await prisma.entry.update({
          where: { id: entryId },
          data: {
            aiInsights: aiResult,
            processingStatus: 'COMPLETED',
            mood: aiResult.mood?.score ? String(aiResult.mood.score) : entry.mood,
            tags: {
              connectOrCreate: aiResult.tags?.map((tag) => ({
                where: { name: tag },
                create: { name: tag },
              })) || [],
            },
          },
        });

        const io = getIO();
        io.to(`user_${entry.userId}`).emit('ENTRY_PROCESSED', {
          entryId: entry.id,
          status: 'COMPLETED',
          insights: aiResult,
        });

        // Queue Backlog Check
        const jobCounts = await aiQueue.getJobCounts();
        if (jobCounts.waiting > 50) {
          io.emit('SYSTEM_ALERT', { 
            type: 'BACKLOG', 
            message: 'High AI load detected. Processing may be slightly delayed.' 
          });
        }

        return aiResult;
      } catch (error) {
        logger.error(`Job ${job.id} failed: ${error.message}`);
        await prisma.entry.update({
          where: { id: entryId },
          data: { processingStatus: 'FAILED' },
        });
        throw error;
      }
    },
    {
      connection,
      concurrency: 5,
      limiter: { max: 10, duration: 1000 },
    }
  );

  // Cold Start Recovery: Pick up PENDING entries not in queue
  const recoverStuckJobs = async () => {
    logger.info('Running Cold Start Recovery check...');
    const stuckEntries = await prisma.entry.findMany({
      where: { 
        processingStatus: 'PENDING',
        aiEnabled: true,
        createdAt: { lt: new Date(Date.now() - 5 * 60 * 1000) } // Older than 5 mins
      }
    });

    for (const entry of stuckEntries) {
      await aiQueue.add('recover-entry', { entryId: entry.id }, {
        jobId: `entry_${entry.id}`
      });
      logger.info(`Recovered stuck entry ${entry.id}`);
    }
  };

  recoverStuckJobs().catch(err => {
    logger.error('Cold Start Recovery failed:', err);
  });

  return worker;
};

module.exports = initAIWorker;
