// backend/src/socket/socket.js
// Socket.io configuration for scalable real-time events

const { Server } = require('socket.io');

let io;

function initSocket(server) {
  const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

  io = new Server(server, {
    cors: {
      origin: frontendOrigin,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    // You can add more event listeners here for scalability
    // e.g., socket.on('joinRoom', ...)
    // For now, just log connection
    // console.log('Socket connected:', socket.id);
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
}

// Helper to emit schedule events
function emitScheduleEvent(event, payload) {
  if (!io) return;
  io.emit(event, payload);
}

module.exports = {
  initSocket,
  getIO,
  emitScheduleEvent,
};
