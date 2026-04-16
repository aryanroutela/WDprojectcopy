const Bus = require("../models/Bus");

// ==================== USER/PASSENGER OPERATIONS ====================

/**
 * Get all active buses
 * GET /api/user/buses
 */
const getAllBuses = async (req, res, next) => {
  try {
    const buses = await Bus.find({ status: "active" })
      .populate("driverId", "firstName lastName phone");

    // Format response
    const busesData = buses.map(bus => ({
      _id: bus._id,
      busNumber: bus.busNumber,
      routeName: bus.routeName,
      capacity: bus.capacity,
      seatsAvailable: bus.seatsAvailable,
      occupancy: ((bus.capacity - bus.seatsAvailable) / bus.capacity * 100).toFixed(1),
      status: bus.seatsAvailable > bus.capacity * 0.25 ? "green" : 
              bus.seatsAvailable > 0 ? "yellow" : "red",
      location: bus.currentLocation,
      eta: bus.eta,
      driver: bus.driverId
    }));

    res.status(200).json({
      success: true,
      count: busesData.length,
      buses: busesData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search buses by route
 * GET /api/user/buses/search?route=routeName
 */
const searchBusesByRoute = async (req, res, next) => {
  try {
    const { route } = req.query;

    if (!route) {
      return res.status(400).json({
        success: false,
        message: "Route name is required"
      });
    }

    const buses = await Bus.find({
      status: "active",
      routeName: new RegExp(route, "i")
    }).populate("driverId", "firstName lastName phone");

    // Format response
    const busesData = buses.map(bus => ({
      _id: bus._id,
      busNumber: bus.busNumber,
      routeName: bus.routeName,
      capacity: bus.capacity,
      seatsAvailable: bus.seatsAvailable,
      occupancy: ((bus.capacity - bus.seatsAvailable) / bus.capacity * 100).toFixed(1),
      status: bus.seatsAvailable > bus.capacity * 0.25 ? "green" : 
              bus.seatsAvailable > 0 ? "yellow" : "red",
      location: bus.currentLocation,
      eta: bus.eta,
      driver: bus.driverId
    }));

    res.status(200).json({
      success: true,
      count: busesData.length,
      route,
      buses: busesData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single bus details
 * GET /api/user/bus/:busId
 */
const getBusDetails = async (req, res, next) => {
  try {
    const { busId } = req.params;

    const bus = await Bus.findById(busId)
      .populate("driverId", "firstName lastName email phone");

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: "Bus not found"
      });
    }

    const response = {
      _id: bus._id,
      busNumber: bus.busNumber,
      routeName: bus.routeName,
      capacity: bus.capacity,
      seatsAvailable: bus.seatsAvailable,
      occupancy: ((bus.capacity - bus.seatsAvailable) / bus.capacity * 100).toFixed(1),
      status: bus.seatsAvailable > bus.capacity * 0.25 ? "green" : 
              bus.seatsAvailable > 0 ? "yellow" : "red",
      location: bus.currentLocation,
      eta: bus.eta,
      stops: bus.stops,
      driver: bus.driverId,
      createdAt: bus.createdAt
    };

    res.status(200).json({
      success: true,
      bus: response
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get nearby buses (for future implementation with location)
 * GET /api/user/buses/nearby?lat=&lng=&radius=5
 */
const getNearbyBuses = async (req, res, next) => {
  try {
    const { lat, lng, radius = 5 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required"
      });
    }

    // Simple distance calculation (can be improved with MongoDB geospatial queries)
    const buses = await Bus.find({ status: "active" })
      .populate("driverId", "firstName lastName phone");

    // Filter buses within radius
    const nearbyBuses = buses.filter(bus => {
      if (!bus.currentLocation) return false;
      
      // Simple Euclidean distance (should use Haversine for real lat/lng)
      const dx = bus.currentLocation.latitude - parseFloat(lat);
      const dy = bus.currentLocation.longitude - parseFloat(lng);
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      return distance <= parseFloat(radius);
    });

    const busesData = nearbyBuses.map(bus => ({
      _id: bus._id,
      busNumber: bus.busNumber,
      routeName: bus.routeName,
      capacity: bus.capacity,
      seatsAvailable: bus.seatsAvailable,
      occupancy: ((bus.capacity - bus.seatsAvailable) / bus.capacity * 100).toFixed(1),
      status: bus.seatsAvailable > bus.capacity * 0.25 ? "green" : 
              bus.seatsAvailable > 0 ? "yellow" : "red",
      location: bus.currentLocation,
      eta: bus.eta,
      driver: bus.driverId
    }));

    res.status(200).json({
      success: true,
      count: busesData.length,
      radius,
      buses: busesData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get routes available
 * GET /api/user/routes
 */
const getAvailableRoutes = async (req, res, next) => {
  try {
    const routes = await Bus.find({ status: "active" })
      .distinct("routeName");

    res.status(200).json({
      success: true,
      count: routes.length,
      routes
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllBuses,
  searchBusesByRoute,
  getBusDetails,
  getNearbyBuses,
  getAvailableRoutes
};
