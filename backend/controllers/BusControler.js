const Bus = require("../models/Bus");
const Location = require("../models/Location");

// Get all buses with live data
const getAllBuses = async (req, res, next) => {
  try {
    const buses = await Bus.find({ status: "active" });

    // Get latest location for each bus
    const busesWithLocation = await Promise.all(
      buses.map(async (bus) => {
        const latestLocation = await Location.findOne(
          { busId: bus._id }
        ).sort({ timestamp: -1 }).limit(1);

        return {
          _id: bus._id,
          busNumber: bus.busNumber,
          routeName: bus.routeName,
          capacity: bus.capacity,
          seatsAvailable: bus.seatsAvailable,
          status: bus.seatsAvailable > bus.capacity * 0.25 ? "green" : 
                  bus.seatsAvailable > 0 ? "yellow" : "red",
          location: latestLocation ? {
            lat: latestLocation.latitude,
            lng: latestLocation.longitude
          } : null
        };
      })
    );

    res.status(200).json({
      success: true,
      buses: busesWithLocation
    });
  } catch (error) {
    next(error);
  }
};

// Get single bus details
const getBusById = async (req, res, next) => {
  try {
    const bus = await Bus.findById(req.params.id);

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

// Create new bus (Admin only)
const createBus = async (req, res, next) => {
  try {
    const { busNumber, routeName, capacity, seatsAvailable } = req.body;

    const bus = new Bus({
      busNumber,
      routeName,
      capacity,
      seatsAvailable: seatsAvailable || capacity,
      lastUpdatedBy: req.userId
    });

    await bus.save();

    res.status(201).json({
      success: true,
      message: "Bus created successfully",
      bus
    });
  } catch (error) {
    next(error);
  }
};

// Update bus seat availability
const updateBusSeats = async (req, res, next) => {
  try {
    const { seatsAvailable } = req.body;
    const bus = await Bus.findByIdAndUpdate(
      req.params.id,
      { 
        seatsAvailable,
        lastUpdatedBy: req.userId,
        updatedAt: Date.now()
      },
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
      message: "Seats updated successfully",
      bus
    });
  } catch (error) {
    next(error);
  }
};

// Update bus location (Driver endpoint - called via Socket.io)
const updateBusLocation = async (req, res, next) => {
  try {
    const { busId, latitude, longitude, speed } = req.body;

    const location = new Location({
      busId,
      latitude,
      longitude,
      speed: speed || 0
    });

    await location.save();

    res.status(201).json({
      success: true,
      message: "Location updated"
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllBuses,
  getBusById,
  createBus,
  updateBusSeats,
  updateBusLocation
};