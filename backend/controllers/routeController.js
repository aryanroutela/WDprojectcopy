const Route = require("../models/Route");
const Bus = require("../models/Bus");
const { findBusesByStop, haversineDistance } = require("../utils/etaCalculator");

// ==================== ROUTE MANAGEMENT ====================

/**
 * Create a new route with checkpoints
 * POST /api/routes
 * Admin only
 */
const createRoute = async (req, res, next) => {
  try {
    const { routeName, checkpoints } = req.body;

    if (!routeName || !checkpoints || checkpoints.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Route name and at least 2 checkpoints are required"
      });
    }

    // Sort and tag checkpoints by sequence
    const sorted = checkpoints
      .map((cp, i) => ({ ...cp, sequence: cp.sequence ?? i }))
      .sort((a, b) => a.sequence - b.sequence);

    // Auto-calculate cumulative distance if coordinates are provided
    let cumulativeDist = 0;
    const enriched = sorted.map((cp, i) => {
      if (i === 0) return { ...cp, distanceFromStart: 0 };
      const prev = sorted[i - 1];
      if (prev.latitude && prev.longitude && cp.latitude && cp.longitude) {
        cumulativeDist += haversineDistance(
          prev.latitude, prev.longitude,
          cp.latitude, cp.longitude
        );
      }
      return { ...cp, distanceFromStart: +cumulativeDist.toFixed(2) };
    });

    const totalDistance = +cumulativeDist.toFixed(2);

    const route = new Route({
      routeName,
      checkpoints: enriched,
      totalDistance,
      createdBy: req.userId
    });

    await route.save();

    res.status(201).json({
      success: true,
      message: "Route created successfully",
      route
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Route name already exists" });
    }
    next(error);
  }
};

/**
 * Get all active routes
 * GET /api/routes
 */
const getAllRoutes = async (req, res, next) => {
  try {
    const routes = await Route.find({ isActive: true }).lean();
    res.status(200).json({ success: true, count: routes.length, routes });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single route by ID
 * GET /api/routes/:id
 */
const getRouteById = async (req, res, next) => {
  try {
    const route = await Route.findById(req.params.id).lean();
    if (!route) {
      return res.status(404).json({ success: false, message: "Route not found" });
    }
    res.status(200).json({ success: true, route });
  } catch (error) {
    next(error);
  }
};

/**
 * Update route checkpoints
 * PUT /api/routes/:id
 * Admin only
 */
const updateRoute = async (req, res, next) => {
  try {
    const { routeName, checkpoints, isActive } = req.body;

    const update = { updatedAt: Date.now() };
    if (routeName) update.routeName = routeName;
    if (isActive !== undefined) update.isActive = isActive;

    if (checkpoints && checkpoints.length >= 2) {
      const sorted = checkpoints
        .map((cp, i) => ({ ...cp, sequence: cp.sequence ?? i }))
        .sort((a, b) => a.sequence - b.sequence);

      let cumulativeDist = 0;
      update.checkpoints = sorted.map((cp, i) => {
        if (i === 0) return { ...cp, distanceFromStart: 0 };
        const prev = sorted[i - 1];
        if (prev.latitude && prev.longitude && cp.latitude && cp.longitude) {
          cumulativeDist += haversineDistance(
            prev.latitude, prev.longitude,
            cp.latitude, cp.longitude
          );
        }
        return { ...cp, distanceFromStart: +cumulativeDist.toFixed(2) };
      });
      update.totalDistance = +cumulativeDist.toFixed(2);
    }

    const route = await Route.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!route) {
      return res.status(404).json({ success: false, message: "Route not found" });
    }

    res.status(200).json({ success: true, message: "Route updated", route });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete (deactivate) route
 * DELETE /api/routes/:id
 * Admin only
 */
const deleteRoute = async (req, res, next) => {
  try {
    const route = await Route.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!route) {
      return res.status(404).json({ success: false, message: "Route not found" });
    }
    res.status(200).json({ success: true, message: "Route deactivated" });
  } catch (error) {
    next(error);
  }
};

// ==================== SMART BUS SEARCH BY STOP ====================

/**
 * Find buses that pass through a given stop/checkpoint
 * Source does NOT need to be the starting point — can be any stop in between.
 * GET /api/routes/search?source=StopName&destination=StopName
 */
const searchBusesByStop = async (req, res, next) => {
  try {
    const { source, destination } = req.query;

    if (!source) {
      return res.status(400).json({
        success: false,
        message: "source query param is required"
      });
    }

    // Get all active buses with their route checkpoints
    const buses = await Bus.find({ status: "active" })
      .populate("driverId", "firstName lastName phone")
      .populate("routeId")
      .lean();

    const srcQuery = source.trim().toLowerCase();
    const dstQuery = destination?.trim().toLowerCase();

    const results = buses
      .map((bus) => {
        const checkpoints =
          bus.checkpoints?.length > 0
            ? bus.checkpoints
            : bus.routeId?.checkpoints || [];

        if (checkpoints.length === 0) return null;

        // Find matching source stop
        const srcStop = checkpoints.find((cp) =>
          cp.name.toLowerCase().includes(srcQuery)
        );
        if (!srcStop) return null;

        // If destination also specified, check it appears AFTER source in route
        let dstStop = null;
        if (dstQuery) {
          dstStop = checkpoints.find(
            (cp) =>
              cp.name.toLowerCase().includes(dstQuery) &&
              cp.sequence > srcStop.sequence
          );
          if (!dstStop) return null;
        }

        // Remaining stops from the matched source onwards
        const remainingStops = checkpoints.filter(
          (cp) => cp.sequence >= srcStop.sequence
        );

        return {
          _id: bus._id,
          busNumber: bus.busNumber,
          routeName: bus.routeName,
          source: checkpoints[0]?.name,
          destination: checkpoints[checkpoints.length - 1]?.name,
          allCheckpoints: checkpoints,
          remainingStops,
          matchedSourceStop: srcStop,
          matchedDestStop: dstStop,
          capacity: bus.capacity,
          seatsAvailable: bus.seatsAvailable,
          occupancy: ((bus.capacity - bus.seatsAvailable) / bus.capacity * 100).toFixed(1),
          busStatus: bus.seatsAvailable > bus.capacity * 0.25
            ? "green"
            : bus.seatsAvailable > 0 ? "yellow" : "red",
          currentLocation: bus.currentLocation,
          eta: bus.eta,
          currentCheckpointIdx: bus.currentCheckpointIdx ?? null,
          nextCheckpointName: bus.nextCheckpointName ?? null,
          driver: bus.driverId,
          status: bus.status
        };
      })
      .filter(Boolean)
      // Sort: buses closer to the source stop first
      .sort((a, b) => (a.matchedSourceStop.sequence || 0) - (b.matchedSourceStop.sequence || 0));

    res.status(200).json({
      success: true,
      count: results.length,
      searchedSource: source,
      searchedDestination: destination || null,
      buses: results
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRoute,
  getAllRoutes,
  getRouteById,
  updateRoute,
  deleteRoute,
  searchBusesByStop
};
