import ETAService from '../services/ETAService.js';
import { NotFoundError } from '../utils/errors.js';

export class ETAController {
  /**
   * Get ETA for all stops of a bus
   * GET /api/eta/:busId
   */
  static async getBusETA(req, res, next) {
    try {
      const { busId } = req.params;

      const etaData = await ETAService.calculateBusETA(busId);

      res.status(200).json({
        success: true,
        data: etaData,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get ETA to specific stop
   * GET /api/eta/:busId/stop/:stopId
   */
  static async getETAToStop(req, res, next) {
    try {
      const { busId, stopId } = req.params;

      const etaData = await ETAService.calculateETAToStop(busId, stopId);

      res.status(200).json({
        success: true,
        data: etaData,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get ETA for current bus user is on
   * GET /api/eta/current
   */
  static async getCurrentBusETA(req, res, next) {
    try {
      // TODO: Implement this with LocationTrackingService.getUserCurrentBus
      // Then call ETAService.calculateBusETA

      res.status(200).json({
        success: true,
        data: {},
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ETAController;
