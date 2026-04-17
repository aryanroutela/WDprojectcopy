const Bus = require("../models/Bus");
const User = require("../models/User");
const Route = require("../models/Route");
const { buildStopsETA } = require("../utils/etaCalculator");

// ==================== DRIVER OPERATIONS ====================

/**
 * Register a bus for the driver
 * POST /api/driver/bus/register
 */
const registerBus = async (req, res, next) => {
  try {
    const { busNumber, routeName, source, destination, capacity, stops, checkpoints, routeId } = req.body;
    const driverId = req.userId;

    const existingBus = await Bus.findOne({ busNumber });
    if (existingBus) {
      return res.status(409).json({ success: false, message: "Bus already registered" });
    }

    // If routeId provided, pull checkpoints from the Route document
    let resolvedCheckpoints = checkpoints || [];
    let resolvedSource = source;
    let resolvedDestination = destination;

    if (routeId) {
      const route = await Route.findById(routeId).lean();
      if (route) {
        resolvedCheckpoints = route.checkpoints;
        resolvedSource = route.checkpoints[0]?.name || source;
        resolvedDestination = route.checkpoints[route.checkpoints.length - 1]?.name || destination;
      }
    }

    const bus = new Bus({
      busNumber,
      routeName,
      routeId: routeId || null,
      source: resolvedSource,
      destination: resolvedDestination,
      capacity,
      seatsAvailable: capacity,
      driverId,
      checkpoints: resolvedCheckpoints,
      stops: stops || [],
      status: "inactive"
    });

    await bus.save();

    await User.findByIdAndUpdate(driverId, { busTaken: bus._id }, { new: true });

    res.status(201).json({
      success: true,
      message: "Bus registered successfully! 🚍",
      bus
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update bus location (real-time)
 * POST /api/driver/bus/location
 */
const updateBusLocation = async (req, res, next) => {
  try {
    const { busId, latitude, longitude, eta } = req.body;
    const driverId = req.userId;

    // Verify bus belongs to this driver
    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: "Bus not found"
      });
    }

    if (bus.driverId.toString() !== driverId) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own bus"
      });
    }

    // Update location
    bus.currentLocation = {
      latitude,
      longitude,
      updatedAt: Date.now()
    };

    if (eta) bus.eta = eta;

    await bus.save();

    res.status(200).json({
      success: true,
      message: "Location updated successfully! 📍",
      bus
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update seat availability
 * PATCH /api/driver/bus/:busId/seats
 */
const updateSeatAvailability = async (req, res, next) => {
  try {
    const { busId } = req.params;
    const { seatsAvailable } = req.body;
    const driverId = req.userId;

    // Verify bus belongs to this driver
    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: "Bus not found"
      });
    }

    if (bus.driverId.toString() !== driverId) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own bus"
      });
    }

    // Validate seats
    if (seatsAvailable < 0 || seatsAvailable > bus.capacity) {
      return res.status(400).json({
        success: false,
        message: `Seats must be between 0 and ${bus.capacity}`
      });
    }

    bus.seatsAvailable = seatsAvailable;
    await bus.save();

    res.status(200).json({
      success: true,
      message: "Seats updated! 💺",
      bus
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Start service (activate bus)
 * POST /api/driver/bus/:busId/start
 */
const startService = async (req, res, next) => {
  try {
    const { busId } = req.params;
    const driverId = req.userId;

    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: "Bus not found"
      });
    }

    if (bus.driverId.toString() !== driverId) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own bus"
      });
    }

    bus.status = "active";
    await bus.save();

    res.status(200).json({
      success: true,
      message: "Bus service started! 🚀",
      bus
    });
  } catch (error) {
    next(error);
  }
};

/**
 * End service (deactivate bus)
 * POST /api/driver/bus/:busId/stop
 */
const stopService = async (req, res, next) => {
  try {
    const { busId } = req.params;
    const driverId = req.userId;

    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(404).json({
        success: false,
        message: "Bus not found"
      });
    }

    if (bus.driverId.toString() !== driverId) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own bus"
      });
    }

    bus.status = "inactive";
    await bus.save();

    res.status(200).json({
      success: true,
      message: "Bus service stopped ⛔",
      bus
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get driver's buses
 * GET /api/driver/buses
 */
const getMyBuses = async (req, res, next) => {
  try {
    const driverId = req.userId;

    const buses = await Bus.find({ driverId }).populate("driverId", "firstName lastName email");

    res.status(200).json({
      success: true,
      count: buses.length,
      buses
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single bus details
 * GET /api/driver/bus/:busId
 */
const getBusDetails = async (req, res, next) => {
  try {
    const { busId } = req.params;
    const driverId = req.userId;

    const bus = await Bus.findById(busId).populate("driverId", "firstName lastName email phone");

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: "Bus not found"
      });
    }

    if (bus.driverId._id.toString() !== driverId) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own bus"
      });
    }

    res.status(200).json({
      success: true,
      bus
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update checkpoints for a bus (driver can add/edit stops)
 * PATCH /api/driver/bus/:busId/checkpoints
 */
const updateCheckpoints = async (req, res, next) => {
  try {
    const { busId } = req.params;
    const { checkpoints } = req.body;
    const driverId = req.userId;

    const bus = await Bus.findById(busId);
    if (!bus) return res.status(404).json({ success: false, message: "Bus not found" });
    if (bus.driverId.toString() !== driverId) {
      return res.status(403).json({ success: false, message: "You can only update your own bus" });
    }
    if (!checkpoints || checkpoints.length < 2) {
      return res.status(400).json({ success: false, message: "At least 2 checkpoints required" });
    }

    bus.checkpoints = checkpoints.sort((a, b) => a.sequence - b.sequence);
    await bus.save();

    res.status(200).json({ success: true, message: "Checkpoints updated!", checkpoints: bus.checkpoints });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerBus,
  updateBusLocation,
  updateSeatAvailability,
  startService,
  stopService,
  getMyBuses,
  getBusDetails,
  updateCheckpoints
};
