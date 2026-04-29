const { Server } = require('socket.io');
const logger = require('./logger');

let io;

// Track active viewers per share room
const roomViewers = new Map();

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

    // Allow user to join a shared item's room
    socket.on('join_share_room', (hash) => {
      if (!hash) return;
      const room = `share_${hash}`;
      socket.join(room);

      // Track viewer count
      if (!roomViewers.has(room)) {
        roomViewers.set(room, new Set());
      }
      roomViewers.get(room).add(socket.id);

      const count = roomViewers.get(room).size;
      logger.info(`Socket ${socket.id} joined share room ${room} (${count} viewers)`);

      // Broadcast updated viewer count to the room
      io.to(room).emit('viewer_count', { hash, count });
    });

    // Allow user to leave a shared item's room
    socket.on('leave_share_room', (hash) => {
      if (!hash) return;
      const room = `share_${hash}`;
      socket.leave(room);

      if (roomViewers.has(room)) {
        roomViewers.get(room).delete(socket.id);
        const count = roomViewers.get(room).size;
        if (count === 0) {
          roomViewers.delete(room);
        } else {
          io.to(room).emit('viewer_count', { hash, count });
        }
      }
      logger.info(`Socket ${socket.id} left share room share_${hash}`);
    });

    socket.on('disconnect', () => {
      // Clean up viewer tracking for all rooms this socket was in
      for (const [room, viewers] of roomViewers.entries()) {
        if (viewers.has(socket.id)) {
          viewers.delete(socket.id);
          const count = viewers.size;
          if (count === 0) {
            roomViewers.delete(room);
          } else {
            // Extract hash from room name (share_XXXX)
            const hash = room.replace('share_', '');
            io.to(room).emit('viewer_count', { hash, count });
          }
        }
      }
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
