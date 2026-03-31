import SeatService from '../services/SeatService.js';
import { validateSeatReport } from '../utils/validation.js';
import { ValidationError } from '../utils/errors.js';

export class SeatController {
  /**
   * Report seat availability
   * POST /api/seats/report
   */
  static async reportSeatAvailability(req, res, next) {
    try {
      const { busId, status } = req.body;

      // Validate input
      const validation = validateSeatReport({ busId, status });
      if (!validation.isValid) {
        throw new ValidationError(validation.errors.join('; '));
      }

      const result = await SeatService.reportSeatAvailability(
        req.user.userId,
        busId,
        status
      );

      res.status(201).json({
        success: true,
        message: result.message,
        data: {
          report: result.report,
          aggregatedStatus: result.aggregatedStatus,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get aggregated seat status
   * GET /api/seats/:busId
   */
  static async getSeatStatus(req, res, next) {
    try {
      const { busId } = req.params;

      const seatStatus = await SeatService.getAggregatedSeatStatus(busId);

      res.status(200).json({
        success: true,
        data: seatStatus,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get detailed seat reports
   * GET /api/seats/:busId/reports
   */
  static async getBusReports(req, res, next) {
    try {
      const { busId } = req.params;

      const reports = await SeatService.getBusReports(busId);

      res.status(200).json({
        success: true,
        data: reports,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's reporting history
   * GET /api/seats/history/me
   */
  static async getUserHistory(req, res, next) {
    try {
      const history = await SeatService.getUserReportHistory(req.user.userId);

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default SeatController;
