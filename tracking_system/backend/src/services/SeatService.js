import Bus from '../models/Bus.js';
import User from '../models/User.js';
import SeatReport from '../models/SeatReport.js';
import PassengerSession from '../models/PassengerSession.js';
import { calculateDistance } from '../utils/geolocation.js';
import { AuthorizationError, NotFoundError, ValidationError } from '../utils/errors.js';

export class SeatService {
  /**
   * Validate if user can report seat availability
   * Only drivers or passengers on the bus can report
   */
  static async validateSeatReportAccess(userId, busId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const bus = await Bus.findById(busId);
    if (!bus) {
      throw new NotFoundError('Bus not found');
    }

    // Check 1: User is a driver
    if (user.role === 'driver') {
      return true;
    }

    // Check 2: User is on the bus (within 50m and speed > 15 km/h)
    const distanceFromBus = calculateDistance(
      user.current_lat || 0,
      user.current_lng || 0,
      bus.current_lat,
      bus.current_lng
    );

    const speedThreshold = parseInt(process.env.USER_SPEED_THRESHOLD || 15);
    const distanceThreshold = 50; // 50 meters

    if (distanceFromBus < distanceThreshold && bus.avg_speed > speedThreshold) {
      return true;
    }

    // Check 3: User has active session on this bus
    const isOnBus = await PassengerSession.isUserOnBus(userId, busId);
    if (isOnBus) {
      return true;
    }

    // Access denied
    throw new AuthorizationError(
      'You are not authorized to report seat availability for this bus. ' +
      'Only drivers or passengers on the bus can report. ' +
      `(Distance: ${Math.round(distanceFromBus)}m, Need: < 50m and Speed > ${speedThreshold} km/h)`
    );
  }

  /**
   * Report seat availability
   */
  static async reportSeatAvailability(userId, busId, status) {
    // Validate access
    await this.validateSeatReportAccess(userId, busId);

    // Create report
    const report = await SeatReport.create(busId, userId, status);

    // Get updated aggregated status
    const aggregatedStatus = await this.getAggregatedSeatStatus(busId);

    return {
      report,
      aggregatedStatus,
      message: 'Seat availability reported successfully',
    };
  }

  /**
   * Get aggregated seat status for a bus (majority voting)
   */
  static async getAggregatedSeatStatus(busId) {
    const bus = await Bus.findById(busId);
    if (!bus) {
      throw new NotFoundError('Bus not found');
    }

    const expiryMinutes = parseInt(process.env.SEAT_REPORT_EXPIRY_MINUTES || 10);
    const aggregated = await SeatReport.getAggregatedStatus(busId, expiryMinutes);

    // Check if confidence meets threshold
    const confidenceThreshold = parseInt(
      process.env.SEAT_CONFIDENCE_THRESHOLD || 2
    );
    const meetsThreshold = aggregated.total >= confidenceThreshold;

    return {
      busId,
      status: aggregated.status,
      confidence: aggregated.confidence,
      reportCount: aggregated.total,
      meetsThreshold,
      expiryMinutes,
      message:
        meetsThreshold && aggregated.status !== 'unknown'
          ? `Bus is ${aggregated.status} (${aggregated.count} reports)`
          : 'Insufficient data for reliable seat status',
    };
  }

  /**
   * Get detailed seat reports for a bus
   */
  static async getBusReports(busId) {
    const bus = await Bus.findById(busId);
    if (!bus) {
      throw new NotFoundError('Bus not found');
    }

    const expiryMinutes = parseInt(process.env.SEAT_REPORT_EXPIRY_MINUTES || 10);
    const reports = await SeatReport.getRecentReports(busId, expiryMinutes);

    // Group by status
    const grouped = {
      empty: [],
      standing: [],
      full: [],
    };

    reports.forEach((report) => {
      if (grouped[report.status]) {
        grouped[report.status].push({
          id: report.id,
          userId: report.user_id,
          userName: report.name,
          role: report.role,
          status: report.status,
          timestamp: report.timestamp,
        });
      }
    });

    const aggregated = await this.getAggregatedSeatStatus(busId);

    return {
      busId,
      aggregatedStatus: aggregated,
      reportsByStatus: grouped,
    };
  }

  /**
   * Cleanup expired seat reports
   */
  static async cleanupExpiredReports() {
    const expiryMinutes = parseInt(process.env.SEAT_REPORT_EXPIRY_MINUTES || 10);
    const count = await SeatReport.expireOldReports(expiryMinutes);
    return { expiredReports: count };
  }

  /**
   * Get user's reporting history
   */
  static async getUserReportHistory(userId, limit = 50) {
    const reports = await SeatReport.getUserReports(userId, limit);
    return {
      userId,
      reportCount: reports.length,
      reports: reports.map((r) => ({
        id: r.id,
        busId: r.bus_id,
        status: r.status,
        timestamp: r.timestamp,
      })),
    };
  }
}

export default SeatService;
