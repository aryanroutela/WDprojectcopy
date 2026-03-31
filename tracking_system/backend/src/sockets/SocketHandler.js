import LocationTrackingService from '../services/LocationTrackingService.js';
import ETAService from '../services/ETAService.js';
import SeatService from '../services/SeatService.js';
import PassengerSession from '../models/PassengerSession.js';
import { verifyToken } from '../utils/jwt.js';

export class SocketHandler {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // Map of userId -> socketId
    this.busRooms = new Map(); // Map of busId -> Set of socketIds
  }

  /**
   * Initialize Socket.io event handlers
   */
  registerHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`✅ Client connected: ${socket.id}`);

      // Verify authentication
      socket.on('authenticate', (token) => {
        this._handleAuthentication(socket, token);
      });

      // Location tracking
      socket.on('location:update', (data) =>
        this._handleLocationUpdate(socket, data)
      );

      // Seat reporting
      socket.on('seat:update', (data) =>
        this._handleSeatUpdate(socket, data)
      );

      // Disconnect handling
      socket.on('disconnect', () => this._handleDisconnect(socket));

      // Bus tracking
      socket.on('bus:subscribe', (busId) =>
        this._handleBusSubscribe(socket, busId)
      );

      socket.on('bus:unsubscribe', (busId) =>
        this._handleBusUnsubscribe(socket, busId)
      );

      // Join bus room
      socket.on('join:bus', (busId) =>
        this._handleJoinBus(socket, busId)
      );

      socket.on('leave:bus', (busId) =>
        this._handleLeaveBus(socket, busId)
      );
    });
  }

  /**
   * Handle user authentication
   */
  _handleAuthentication(socket, token) {
    try {
      const decoded = verifyToken(token);
      if (!decoded) {
        socket.emit('auth:error', { message: 'Invalid token' });
        return;
      }

      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      this.connectedUsers.set(decoded.userId, socket.id);

      socket.emit('auth:success', {
        userId: decoded.userId,
        role: decoded.role,
      });

      console.log(`🔐 User authenticated: ${decoded.userId}`);
    } catch (error) {
      socket.emit('auth:error', { message: 'Authentication failed' });
    }
  }

  /**
   * Handle location update
   */
  async _handleLocationUpdate(socket, data) {
    try {
      if (!socket.userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      const { lat, lng, speed } = data;

      // Validate data
      if (
        typeof lat !== 'number' ||
        typeof lng !== 'number' ||
        typeof speed !== 'number'
      ) {
        socket.emit('error', { message: 'Invalid location data' });
        return;
      }

      // Process location update
      const result = await LocationTrackingService.updateUserLocation(
        socket.userId,
        lat,
        lng,
        speed
      );

      // Emit confirmation
      socket.emit('location:update:ack', {
        success: true,
        busId: result.busId,
        routeId: result.routeId,
      });

      // Broadcast to bus room if user is on a bus
      if (result.busId) {
        const busRoom = `bus_${result.busId}`;
        this.io.to(busRoom).emit('bus:user:update', {
          userId: socket.userId,
          busId: result.busId,
          location: { lat, lng },
          speed,
          timestamp: new Date().toISOString(),
        });

        // Calculate and broadcast ETA
        try {
          const eta = await ETAService.calculateBusETA(result.busId);
          this.io.to(busRoom).emit('bus:eta:update', eta);
        } catch (error) {
          console.error('ETA calculation error:', error);
        }
      }
    } catch (error) {
      console.error('Location update error:', error);
      socket.emit('error', { message: 'Location update failed' });
    }
  }

  /**
   * Handle seat availability update
   */
  async _handleSeatUpdate(socket, data) {
    try {
      if (!socket.userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      const { busId, status } = data;

      // Validate data
      if (!busId || !['empty', 'standing', 'full'].includes(status)) {
        socket.emit('error', { message: 'Invalid seat data' });
        return;
      }

      // Report seat availability
      const result = await SeatService.reportSeatAvailability(
        socket.userId,
        busId,
        status
      );

      // Emit confirmation
      socket.emit('seat:update:ack', {
        success: true,
        aggregatedStatus: result.aggregatedStatus,
      });

      // Broadcast to bus room
      const busRoom = `bus_${busId}`;
      this.io.to(busRoom).emit('seat:update', {
        busId,
        aggregatedStatus: result.aggregatedStatus,
        timestamp: new Date().toISOString(),
      });

      console.log(`🪑 Seat update: Bus ${busId} - ${status}`);
    } catch (error) {
      console.error('Seat update error:', error);
      socket.emit('error', { message: error.message || 'Seat update failed' });
    }
  }

  /**
   * Handle user disconnect
   */
  async _handleDisconnect(socket) {
    console.log(`❌ Client disconnected: ${socket.id}`);

    if (socket.userId) {
      this.connectedUsers.delete(socket.userId);

      // Remove user from buses
      try {
        await LocationTrackingService.removeUserFromBuses(socket.userId);
      } catch (error) {
        console.error('Error removing user from buses:', error);
      }
    }
  }

  /**
   * Handle bus subscription (receive updates)
   */
  _handleBusSubscribe(socket, busId) {
    const busRoom = `bus_${busId}`;
    socket.join(busRoom);

    if (!this.busRooms.has(busId)) {
      this.busRooms.set(busId, new Set());
    }

    this.busRooms.get(busId).add(socket.id);

    socket.emit('bus:subscribe:ack', {
      success: true,
      busId,
      message: 'Subscribed to bus updates',
    });

    console.log(`📡 User subscribed to bus ${busId}`);
  }

  /**
   * Handle bus unsubscription
   */
  _handleBusUnsubscribe(socket, busId) {
    const busRoom = `bus_${busId}`;
    socket.leave(busRoom);

    if (this.busRooms.has(busId)) {
      this.busRooms.get(busId).delete(socket.id);
      if (this.busRooms.get(busId).size === 0) {
        this.busRooms.delete(busId);
      }
    }

    socket.emit('bus:unsubscribe:ack', {
      success: true,
      busId,
      message: 'Unsubscribed from bus updates',
    });
  }

  /**
   * Handle joining bus room
   */
  async _handleJoinBus(socket, busId) {
    try {
      if (!socket.userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      // Create passenger session
      await PassengerSession.create(socket.userId, busId);

      const busRoom = `bus_${busId}`;
      socket.join(busRoom);

      // Notify others
      this.io.to(busRoom).emit('bus:passenger:joined', {
        userId: socket.userId,
        busId,
        timestamp: new Date().toISOString(),
      });

      socket.emit('bus:join:ack', { success: true, busId });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  }

  /**
   * Handle leaving bus room
   */
  async _handleLeaveBus(socket, busId) {
    try {
      if (!socket.userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      // End passenger session
      await LocationTrackingService.removeUserFromBuses(socket.userId);

      const busRoom = `bus_${busId}`;
      socket.leave(busRoom);

      // Notify others
      this.io.to(busRoom).emit('bus:passenger:left', {
        userId: socket.userId,
        busId,
        timestamp: new Date().toISOString(),
      });

      socket.emit('bus:leave:ack', { success: true, busId });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  }

  /**
   * Broadcast bus update to all connected clients
   */
  broadcastBusUpdate(busData) {
    const busRoom = `bus_${busData.id}`;
    this.io.to(busRoom).emit('bus:update', {
      ...busData,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcast seat update
   */
  broadcastSeatUpdate(busId, seatData) {
    const busRoom = `bus_${busId}`;
    this.io.to(busRoom).emit('seat:status', {
      busId,
      ...seatData,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get connected user count
   */
  getConnectedUserCount() {
    return this.connectedUsers.size;
  }

  /**
   * Get users on a specific bus
   */
  getUsersOnBus(busId) {
    const busRoom = `bus_${busId}`;
    const room = this.io.sockets.adapter.rooms.get(busRoom);
    return room ? room.size : 0;
  }
}

export default SocketHandler;
