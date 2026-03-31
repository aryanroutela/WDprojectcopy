import LocationTrackingService from '../services/LocationTrackingService.js';
import ETAService from '../services/ETAService.js';
import Bus from '../models/Bus.js';
import Route from '../models/Route.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

export class BusController {
  /**
   * Get all active buses
   * GET /api/buses
   */
  static async getAllBuses(req, res, next) {
    try {
      const buses = await LocationTrackingService.getAllActiveBuses();

      res.status(200).json({
        success: true,
        data: buses,
        count: buses.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get specific bus details
   * GET /api/buses/:id
   */
  static async getBusDetails(req, res, next) {
    try {
      const { id } = req.params;

      const busDetails = await LocationTrackingService.getBusDetails(id);

      res.status(200).json({
        success: true,
        data: busDetails,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get bus by route
   * GET /api/buses/route/:routeId
   */
  static async getBusByRoute(req, res, next) {
    try {
      const { routeId } = req.params;

      // Verify route exists
      const route = await Route.findById(routeId);
      if (!route) {
        throw new NotFoundError('Route not found');
      }

      const buses = await Bus.getByRouteId(routeId);

      const enrichedBuses = await Promise.all(
        buses.map(async (bus) => {
          const busDetails = await LocationTrackingService.getBusDetails(
            bus.id
          );
          return busDetails;
        })
      );

      res.status(200).json({
        success: true,
        route: {
          id: route.id,
          name: route.name,
          number: route.number,
        },
        data: enrichedBuses,
        count: enrichedBuses.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * End bus session (close route)
   * POST /api/buses/:id/close
   */
  static async closeBusSession(req, res, next) {
    try {
      const { id } = req.params;

      // Only drivers can close bus sessions
      if (req.user.role !== 'driver') {
        throw new ValidationError('Only drivers can close bus sessions');
      }

      const result = await LocationTrackingService.endBusSession(id);

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.bus,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current bus for user
   * GET /api/buses/current
   */
  static async getUserCurrentBus(req, res, next) {
    try {
      const busDetails = await LocationTrackingService.getUserCurrentBus(
        req.user.userId
      );

      if (!busDetails) {
        return res.status(200).json({
          success: true,
          message: 'User is not currently on a bus',
          data: null,
        });
      }

      res.status(200).json({
        success: true,
        data: busDetails,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default BusController;
