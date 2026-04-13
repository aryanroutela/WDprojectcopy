import express from 'express';
import { Server } from 'socket.io';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/authRoutes.js';
import busRoutes from './routes/busRoutes.js';
import locationRoutes from './routes/locationRoutes.js';
import etaRoutes from './routes/etaRoutes.js';
import seatRoutes from './routes/seatRoutes.js';
import routeRoutes from './routes/routeRoutes.js';

// Import middleware
import { errorHandler } from './middleware/auth.js';

// Import Socket.io handler
import SocketHandler from './sockets/SocketHandler.js';

// Setup
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.SOCKET_IO_CORS?.split(',') || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Initialize Socket.io handlers
const socketHandler = new SocketHandler(io);
socketHandler.registerHandlers();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.SOCKET_IO_CORS?.split(',') || 'http://localhost:3000',
    credentials: true,
  })
);

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Smart Bus Tracking Backend is running',
    timestamp: new Date().toISOString(),
    connectedUsers: socketHandler.getConnectedUserCount(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/eta', etaRoutes);
app.use('/api/seats', seatRoutes);
app.use('/api/routes', routeRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method,
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    server.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║      🚍 Smart Bus Tracking Backend                          ║
║      ✅ Server running on port ${PORT}                      ║
║      📡 WebSocket ready                                      ║
║      🗄️  Database connected                                 ║
╚════════════════════════════════════════════════════════════╝
      `);

      console.log('📚 API Endpoints:');
      console.log('  🔐 Authentication:');
      console.log('    POST   /api/auth/register');
      console.log('    POST   /api/auth/login');
      console.log('    GET    /api/auth/me');
      console.log('\n  🚍 Buses:');
      console.log('    GET    /api/buses');
      console.log('    GET    /api/buses/:id');
      console.log('    GET    /api/buses/route/:routeId');
      console.log('\n  📍 Location:');
      console.log('    POST   /api/location/update');
      console.log('    GET    /api/location/status');
      console.log('\n  ⏱️  ETA:');
      console.log('    GET    /api/eta/:busId');
      console.log('    GET    /api/eta/:busId/stop/:stopId');
      console.log('\n  🪑 Seats:');
      console.log('    POST   /api/seats/report');
      console.log('    GET    /api/seats/:busId');
      console.log('    GET    /api/seats/:busId/reports');
      console.log('\n  🛣️  Routes:');
      console.log('    GET    /api/routes');
      console.log('    GET    /api/routes/:id');
      console.log('    GET    /api/routes/:id/stops');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export { app, io, socketHandler };
