require("dotenv").config();
const app = require("./app");
const http = require("http");
const { Server } = require("socket.io");
const initializeSocket = require("./config/socket");

const PORT = process.env.PORT || 5000;

// Create HTTP server for Socket.io
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: [process.env.FRONTEND_URL, process.env.ADMIN_URL],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Setup Socket.io handlers
initializeSocket(io);

// Start server
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════╗
║  🚌 ROUTEFLOW BACKEND              ║
║  ✅ Server running on port ${PORT} ║
║  🔗 http://localhost:${PORT}       ║
╚════════════════════════════════════╝
  `);
});