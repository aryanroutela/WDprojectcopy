const Bus = require("../models/Bus");
const User = require("../models/User");

// ==================== ADMIN OPERATIONS ====================

/**
 * Get all buses (all routes, all drivers)
 * GET /api/admin/buses
 */
const getAllBuses = async (req, res, next) => {
  try {
    const { status, route } = req.query;

    // Build filter
    let filter = {};
    if (status) filter.status = status;
    if (route) filter.routeName = new RegExp(route, "i"); // Case-insensitive search

    const buses = await Bus.find(filter)
      .populate("driverId", "firstName lastName email phone licenseNumber");

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
 * Get all active buses with live data
 * GET /api/admin/buses/live
 */
const getLiveBuses = async (req, res, next) => {
  try {
    const buses = await Bus.find({ status: "active" })
      .populate("driverId", "firstName lastName email phone");

    // Format for live tracking
    const liveBuses = buses.map(bus => ({
      _id: bus._id,
      busNumber: bus.busNumber,
      routeName: bus.routeName,
      capacity: bus.capacity,
      seatsAvailable: bus.seatsAvailable,
      occupancy: ((bus.capacity - bus.seatsAvailable) / bus.capacity * 100).toFixed(1),
      driver: bus.driverId,
      location: bus.currentLocation,
      eta: bus.eta,
      status: bus.status
    }));

    res.status(200).json({
      success: true,
      count: liveBuses.length,
      buses: liveBuses
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single bus details
 * GET /api/admin/bus/:busId
 */
const getBusById = async (req, res, next) => {
  try {
    const { busId } = req.params;

    const bus = await Bus.findById(busId)
      .populate("driverId", "firstName lastName email phone licenseNumber");

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: "Bus not found"
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
 * Get all drivers
 * GET /api/admin/drivers
 */
const getAllDrivers = async (req, res, next) => {
  try {
    const drivers = await User.find({ role: "driver" })
      .select("-password")
      .populate("busTaken");

    res.status(200).json({
      success: true,
      count: drivers.length,
      drivers
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single driver details
 * GET /api/admin/driver/:driverId
 */
const getDriverById = async (req, res, next) => {
  try {
    const { driverId } = req.params;

    const driver = await User.findById(driverId)
      .select("-password")
      .populate("busTaken");

    if (!driver || driver.role !== "driver") {
      return res.status(404).json({
        success: false,
        message: "Driver not found"
      });
    }

    res.status(200).json({
      success: true,
      driver
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users
 * GET /api/admin/users
 */
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({ role: "user" }).select("-password");

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deactivate/Activate driver
 * PATCH /api/admin/driver/:driverId/status
 */
const updateDriverStatus = async (req, res, next) => {
  try {
    const { driverId } = req.params;
    const { isActive } = req.body;

    const driver = await User.findByIdAndUpdate(
      driverId,
      { isActive },
      { new: true }
    ).select("-password");

    if (!driver || driver.role !== "driver") {
      return res.status(404).json({
        success: false,
        message: "Driver not found"
      });
    }

    res.status(200).json({
      success: true,
      message: `Driver ${isActive ? "activated" : "deactivated"}`,
      driver
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove bus from service (maintenance)
 * PATCH /api/admin/bus/:busId/maintenance
 */
const setBusMaintenance = async (req, res, next) => {
  try {
    const { busId } = req.params;

    const bus = await Bus.findByIdAndUpdate(
      busId,
      { status: "maintenance" },
      { new: true }
    );

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: "Bus not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Bus set to maintenance ⚙️",
      bus
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get statistics/dashboard data
 * GET /api/admin/stats
 */
const getStats = async (req, res, next) => {
  try {
    const totalBuses = await Bus.countDocuments();
    const activeBuses = await Bus.countDocuments({ status: "active" });
    const totalDrivers = await User.countDocuments({ role: "driver" });
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalAdmins = await User.countDocuments({ role: "admin" });

    // Average occupancy
    const buses = await Bus.find({ status: "active" });
    const avgOccupancy = buses.length > 0 
      ? (buses.reduce((sum, b) => sum + (b.capacity - b.seatsAvailable) / b.capacity, 0) / buses.length * 100).toFixed(1)
      : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalBuses,
        activeBuses,
        inactiveBuses: totalBuses - activeBuses,
        totalDrivers,
        totalUsers,
        totalAdmins,
        avgOccupancy: `${avgOccupancy}%`
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllBuses,
  getLiveBuses,
  getBusById,
  getAllDrivers,
  getDriverById,
  getAllUsers,
  updateDriverStatus,
  setBusMaintenance,
  getStats
};
