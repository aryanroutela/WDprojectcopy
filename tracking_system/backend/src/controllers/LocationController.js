import LocationTrackingService from '../services/LocationTrackingService.js';
import { validateLocationUpdate } from '../utils/validation.js';
import { ValidationError } from '../utils/errors.js';

export class LocationController {
  /**
   * Update user location
   * POST /api/location/update
   */
  static async updateLocation(req, res, next) {
    try {
      const { lat, lng, speed } = req.body;

      // Validate input
      const validation = validateLocationUpdate({ lat, lng, speed });
      if (!validation.isValid) {
        throw new ValidationError(validation.errors.join('; '));
      }

      const result = await LocationTrackingService.updateUserLocation(
        req.user.userId,
        lat,
        lng,
        speed
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          busId: result.busId,
          routeId: result.routeId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's current location status
   * GET /api/location/status
   */
  static async getLocationStatus(req, res, next) {
    try {
      const currentBus = await LocationTrackingService.getUserCurrentBus(
        req.user.userId
      );

      res.status(200).json({
        success: true,
        data: {
          onBus: !!currentBus,
          busDetails: currentBus || null,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove user from bus
   * POST /api/location/exit-bus
   */
  static async exitBus(req, res, next) {
    try {
      await LocationTrackingService.removeUserFromBuses(req.user.userId);

      res.status(200).json({
        success: true,
        message: 'User removed from bus',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default LocationController;
