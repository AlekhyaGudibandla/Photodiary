const { Queue, Worker, QueueEvents } = require('bullmq');
const Redis = require('ioredis');
const logger = require('./logger');

// Upstash Redis connection string or local redis
const redisConfig = process.env.REDIS_URL || {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
};

const connection = new Redis(redisConfig, {
  maxRetriesPerRequest: null, // Required by BullMQ
});

connection.on('error', (err) => {
  logger.error('Redis connection error:', err);
});

// AI Processing Queue
const aiQueue = new Queue('ai-processing', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false, // Keep for debugging as per lifecycle rules
  },
});

module.exports = {
  aiQueue,
  connection,
};
