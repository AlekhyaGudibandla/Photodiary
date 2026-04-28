const { Server } = require('socket.io');
const logger = require('./logger');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // Adjust in production
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Allow user to join their own room
    socket.on('join', (userId) => {
      socket.join(`user_${userId}`);
      logger.info(`User ${userId} joined room user_${userId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

module.exports = {
  initSocket,
  getIO
};
