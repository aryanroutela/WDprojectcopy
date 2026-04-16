const Location = require("../models/Location");
const Bus = require("../models/Bus");

/**
 * Initialize Socket.IO handlers for real-time bus tracking
 */
const initializeSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    // ==================== DRIVER EVENTS ====================

    /**
     * Driver joins a room for their bus
     * Allows filtering by bus ID
     */
    socket.on("driver:joinBus", (data) => {
      const { busId, driverId } = data;
      socket.join(`bus-${busId}`);
      socket.join(`driver-${driverId}`);
      console.log(`🚍 Driver ${driverId} joined bus ${busId}`);

      io.to(`bus-${busId}`).emit("driver:connected", {
        busId,
        driverId,
        message: "Driver is online",
        timestamp: new Date()
      });
    });

    /**
     * Driver sends real-time location update
     */
    socket.on("driver:updateLocation", async (data) => {
      try {
        const { busId, driverId, latitude, longitude, speed, eta } = data;

        // Save location to database
        const location = new Location({
          busId,
          latitude,
          longitude,
          speed: speed || 0
        });
        await location.save();

        // Update bus in database
        await Bus.findByIdAndUpdate(
          busId,
          {
            currentLocation: {
              latitude,
              longitude,
              updatedAt: new Date()
            },
            eta
          },
          { new: true }
        );

        // Broadcast to all connected users
        io.emit("bus:locationUpdate", {
          busId,
          driverId,
          coordinates: { latitude, longitude },
          speed,
          eta,
          timestamp: new Date()
        });

        // Also emit to specific bus room
        io.to(`bus-${busId}`).emit("bus:realTimeUpdate", {
          busId,
          location: { latitude, longitude },
          speed,
          eta,
          timestamp: new Date()
        });
      } catch (error) {
        console.error("Location update error:", error);
        socket.emit("error", { message: "Failed to update location" });
      }
    });

    /**
     * Driver updates seat availability
     */
    socket.on("driver:updateSeats", async (data) => {
      try {
        const { busId, seatsAvailable, capacity } = data;

        const bus = await Bus.findByIdAndUpdate(
          busId,
          { seatsAvailable },
          { new: true }
        );

        const occupancy = ((capacity - seatsAvailable) / capacity * 100).toFixed(1);

        // Broadcast to all users
        io.emit("bus:seatsUpdate", {
          busId,
          seatsAvailable,
          capacity,
          occupancy: `${occupancy}%`,
          status: seatsAvailable > capacity * 0.25 ? "green" : 
                  seatsAvailable > 0 ? "yellow" : "red",
          timestamp: new Date()
        });

        socket.emit("driver:seatsUpdated", { success: true });
      } catch (error) {
        console.error("Seats update error:", error);
      }
    });

    /**
     * Driver comes online (starts service)
     */
    socket.on("driver:startService", async (data) => {
      const { busId, driverId } = data;
      
      await Bus.findByIdAndUpdate(busId, { status: "active" });

      io.emit("bus:serviceStarted", {
        busId,
        message: "Bus service started",
        timestamp: new Date()
      });

      console.log(`✅ Bus ${busId} service started by driver ${driverId}`);
    });

    /**
     * Driver goes offline (stops service)
     */
    socket.on("driver:stopService", async (data) => {
      const { busId, driverId } = data;
      
      await Bus.findByIdAndUpdate(busId, { status: "inactive" });

      io.emit("bus:serviceStopped", {
        busId,
        message: "Bus service stopped",
        timestamp: new Date()
      });

      console.log(`⛔ Bus ${busId} service stopped by driver ${driverId}`);
    });

    // ==================== USER/ADMIN EVENTS ====================

    /**
     * User/Admin joins tracking room
     * Receives live updates for all buses
     */
    socket.on("user:joinTracking", (data) => {
      const { userId, role } = data;
      socket.join("tracking-room");
      socket.join(`user-${userId}`);
      console.log(`📍 ${role} ${userId} joined tracking`);

      socket.emit("tracking:connected", {
        message: "Connected to live tracking",
        timestamp: new Date()
      });
    });

    /**
     * Admin joins admin room
     * Receives aggregated data
     */
    socket.on("admin:joinDashboard", (data) => {
      const { adminId } = data;
      socket.join("admin-dashboard");
      console.log(`🔧 Admin ${adminId} joined dashboard`);
    });

    // ==================== GENERAL EVENTS ====================

    /**
     * Get all active buses
     */
    socket.on("getBuses", async () => {
      try {
        const buses = await Bus.find({ status: "active" })
          .populate("driverId", "firstName lastName");

        const busesData = buses.map(bus => ({
          _id: bus._id,
          busNumber: bus.busNumber,
          routeName: bus.routeName,
          location: bus.currentLocation,
          eta: bus.eta,
          seatsAvailable: bus.seatsAvailable,
          capacity: bus.capacity,
          occupancy: ((bus.capacity - bus.seatsAvailable) / bus.capacity * 100).toFixed(1) + "%"
        }));

        socket.emit("buses:list", busesData);
      } catch (error) {
        console.error("Error fetching buses:", error);
      }
    });

    /**
     * Disconnect handler
     */
    socket.on("disconnect", () => {
      console.log(`🔌 User disconnected: ${socket.id}`);
    });
  });
};

module.exports = initializeSocket;