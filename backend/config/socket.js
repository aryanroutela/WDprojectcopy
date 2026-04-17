const Location = require("../models/Location");
const Bus = require("../models/Bus");
const { buildStopsETA } = require("../utils/etaCalculator");

/**
 * Initialize Socket.IO handlers for real-time bus tracking.
 * Extends the existing handler with:
 *  - Full ETA calculation per checkpoint
 *  - Checkpoint progress detection & broadcasting
 *  - Smart route-progress updates (passed/next/upcoming stops)
 */
const initializeSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    // ==================== DRIVER EVENTS ====================

    /**
     * Driver joins a room for their bus
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
     * Driver sends real-time location update.
     * Now also computes ETA to every checkpoint and broadcasts full stop progress.
     */
    socket.on("driver:updateLocation", async (data) => {
      try {
        const { busId, driverId, latitude, longitude, speed, heading } = data;

        // 1. Persist raw location
        const location = new Location({
          busId,
          latitude,
          longitude,
          speed: speed || 0
        });
        await location.save();

        // 2. Fetch bus with checkpoints
        const bus = await Bus.findById(busId).lean();
        if (!bus) {
          socket.emit("error", { message: "Bus not found" });
          return;
        }

        const checkpoints = bus.checkpoints || [];
        const speedKmh = speed
          ? Math.abs(speed) > 1 ? Math.abs(speed) : 30   // raw m/s → treat as km/h fallback  
          : 30;

        // 3. Compute checkpoint progress & ETA
        const etaData = checkpoints.length >= 2
          ? buildStopsETA(latitude, longitude, speedKmh, checkpoints)
          : null;

        const etaToNextStop = etaData?.etaToNextStop ?? null;

        // 4. Update Bus document with latest position + checkpoint progress
        const busUpdate = {
          currentLocation: { latitude, longitude, updatedAt: new Date() },
          eta: etaToNextStop
        };
        if (etaData) {
          busUpdate.currentCheckpointIdx  = etaData.currentCheckpointIdx;
          busUpdate.nextCheckpointIdx     = etaData.nextCheckpointIdx;
          busUpdate.currentCheckpointName = etaData.currentCheckpointName;
          busUpdate.nextCheckpointName    = etaData.nextCheckpointName;
        }
        await Bus.findByIdAndUpdate(busId, busUpdate);

        // 5. Broadcast to ALL connected clients (global map view)
        const locationPayload = {
          busId,
          driverId,
          busNumber: bus.busNumber,
          routeName: bus.routeName,
          coordinates: { latitude, longitude },
          speed: speedKmh,
          heading: heading || 0,
          eta: etaToNextStop,
          etaData,
          timestamp: new Date()
        };

        io.emit("bus:locationUpdate", locationPayload);

        // 6. Also emit to bus-specific room (riders tracking this bus)
        io.to(`bus-${busId}`).emit("bus:realTimeUpdate", {
          busId,
          location: { latitude, longitude },
          speed: speedKmh,
          heading: heading || 0,
          eta: etaToNextStop,
          checkpointProgress: etaData,
          timestamp: new Date()
        });

        // 7. Emit to admin dashboard
        io.to("admin-dashboard").emit("bus:adminUpdate", {
          busId,
          busNumber: bus.busNumber,
          location: { latitude, longitude },
          eta: etaToNextStop,
          currentStop: etaData?.currentCheckpointName,
          nextStop: etaData?.nextCheckpointName,
          timestamp: new Date()
        });

      } catch (error) {
        console.error("Location update error:", error);
        socket.emit("error", { message: "Failed to update location" });
      }
    });

    /**
     * Driver manually marks arrival at a checkpoint
     */
    socket.on("driver:arrivedAtCheckpoint", async (data) => {
      try {
        const { busId, checkpointIdx, checkpointName } = data;

        const bus = await Bus.findById(busId).lean();
        if (!bus) return;

        const nextIdx = checkpointIdx + 1;
        const nextStop = bus.checkpoints?.[nextIdx] || null;

        await Bus.findByIdAndUpdate(busId, {
          currentCheckpointIdx: checkpointIdx,
          nextCheckpointIdx: nextIdx,
          currentCheckpointName: checkpointName,
          nextCheckpointName: nextStop?.name || null
        });

        io.emit("bus:checkpointReached", {
          busId,
          busNumber: bus.busNumber,
          checkpointIdx,
          checkpointName,
          nextStop: nextStop?.name || "End of Route",
          allCheckpoints: bus.checkpoints,
          timestamp: new Date()
        });

        console.log(`📍 Bus ${bus.busNumber} reached: ${checkpointName}`);
      } catch (error) {
        console.error("Checkpoint update error:", error);
      }
    });

    /**
     * Driver updates seat availability
     */
    socket.on("driver:updateSeats", async (data) => {
      try {
        const { busId, seatsAvailable, capacity } = data;

        await Bus.findByIdAndUpdate(busId, { seatsAvailable }, { new: true });

        const occupancy = ((capacity - seatsAvailable) / capacity * 100).toFixed(1);

        io.emit("bus:seatsUpdate", {
          busId,
          seatsAvailable,
          capacity,
          occupancy: `${occupancy}%`,
          status: seatsAvailable > capacity * 0.25 ? "green"
                : seatsAvailable > 0 ? "yellow" : "red",
          timestamp: new Date()
        });

        socket.emit("driver:seatsUpdated", { success: true });
      } catch (error) {
        console.error("Seats update error:", error);
      }
    });

    /**
     * Driver starts service
     */
    socket.on("driver:startService", async (data) => {
      const { busId, driverId } = data;
      const bus = await Bus.findByIdAndUpdate(
        busId,
        { status: "active", currentCheckpointIdx: -1 },
        { new: true }
      ).lean();

      io.emit("bus:serviceStarted", {
        busId,
        busNumber: bus?.busNumber,
        routeName: bus?.routeName,
        checkpoints: bus?.checkpoints || [],
        message: "Bus service started",
        timestamp: new Date()
      });
      console.log(`✅ Bus ${busId} service started by driver ${driverId}`);
    });

    /**
     * Driver stops service
     */
    socket.on("driver:stopService", async (data) => {
      const { busId, driverId } = data;
      await Bus.findByIdAndUpdate(busId, {
        status: "inactive",
        currentLocation: { latitude: null, longitude: null, updatedAt: null },
        currentCheckpointIdx: -1,
        nextCheckpointIdx: 0,
        currentCheckpointName: null,
        nextCheckpointName: null,
        eta: null
      });

      io.emit("bus:serviceStopped", {
        busId,
        message: "Bus service stopped",
        timestamp: new Date()
      });
      console.log(`⛔ Bus ${busId} service stopped by driver ${driverId}`);
    });

    // ==================== USER / ADMIN EVENTS ====================

    /**
     * User joins tracking room — receives all live bus updates
     */
    socket.on("user:joinTracking", (data) => {
      const { userId, role } = data;
      socket.join("tracking-room");
      socket.join(`user-${userId}`);
      console.log(`📍 ${role || "user"} ${userId} joined tracking`);

      socket.emit("tracking:connected", {
        message: "Connected to live tracking",
        timestamp: new Date()
      });
    });

    /**
     * User subscribes to a specific bus for detailed updates
     */
    socket.on("user:trackBus", (data) => {
      const { busId } = data;
      socket.join(`bus-${busId}`);
      console.log(`👁 Socket ${socket.id} tracking bus ${busId}`);
      socket.emit("bus:trackingStarted", { busId, message: "Now tracking bus" });
    });

    /**
     * User unsubscribes from a specific bus
     */
    socket.on("user:untrackBus", (data) => {
      const { busId } = data;
      socket.leave(`bus-${busId}`);
    });

    /**
     * Admin joins dashboard
     */
    socket.on("admin:joinDashboard", (data) => {
      const { adminId } = data;
      socket.join("admin-dashboard");
      console.log(`🔧 Admin ${adminId} joined dashboard`);
    });

    // ==================== GENERAL EVENTS ====================

    /**
     * Get snapshot of all active buses (for initial map load)
     */
    socket.on("getBuses", async () => {
      try {
        const buses = await Bus.find({ status: "active" })
          .populate("driverId", "firstName lastName")
          .lean();

        const busesData = buses.map((bus) => ({
          _id: bus._id,
          busNumber: bus.busNumber,
          routeName: bus.routeName,
          location: bus.currentLocation,
          eta: bus.eta,
          seatsAvailable: bus.seatsAvailable,
          capacity: bus.capacity,
          occupancy:
            ((bus.capacity - bus.seatsAvailable) / bus.capacity * 100).toFixed(1) + "%",
          checkpoints: bus.checkpoints || [],
          currentCheckpointIdx: bus.currentCheckpointIdx ?? -1,
          currentCheckpointName: bus.currentCheckpointName || null,
          nextCheckpointName: bus.nextCheckpointName || null,
          status: bus.status
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