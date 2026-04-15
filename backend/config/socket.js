const Location = require("../models/Location");
const Bus = require("../models/Bus");

const initializeSocket = (io) => {
  io.on("connection", (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    // Driver sends location update
    socket.on("location:update", async (data) => {
      try {
        const { busId, lat, lng, speed } = data;

        // Save location to DB
        const location = new Location({
          busId,
          latitude: lat,
          longitude: lng,
          speed: speed || 0
        });

        await location.save();

        // Broadcast to all clients
        io.emit("bus:LocationUpdate", {
          busId,
          coordinates: { lat, lng },
          speed,
          timestamp: new Date()
        });
      } catch (error) {
        console.error("Location update error:", error);
      }
    });

    // Driver sends seat update
    socket.on("seats:update", async (data) => {
      try {
        const { busId, seatsAvailable } = data;

        // Update database
        const bus = await Bus.findByIdAndUpdate(
          busId,
          { seatsAvailable },
          { new: true }
        );

        // Broadcast to all clients
        io.emit("bus:seatsUpdate", {
          busId,
          seatsAvailable,
          timestamp: new Date()
        });
      } catch (error) {
        console.error("Seats update error:", error);
      }
    });

    // Passenger subscribes to specific bus updates
    socket.on("subscribe:bus", (busId) => {
      socket.join(`bus-${busId}`);
      console.log(`Client subscribed to bus ${busId}`);
    });

    socket.on("disconnect", () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });
};

module.exports = initializeSocket;