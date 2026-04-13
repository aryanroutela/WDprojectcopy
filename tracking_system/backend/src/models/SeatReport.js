import pool from '../utils/database.js';
import { DatabaseError } from '../utils/errors.js';

export class SeatReport {
  /**
   * Create a new seat report
   */
  static async create(busId, userId, status) {
    try {
      const result = await pool.query(
        `INSERT INTO seat_reports (bus_id, user_id, status, is_active)
         VALUES ($1, $2, $3, true)
         RETURNING id, bus_id, user_id, status, timestamp`,
        [busId, userId, status]
      );
      return result.rows[0];
    } catch (error) {
      throw new DatabaseError(`Failed to create seat report: ${error.message}`);
    }
  }

  /**
   * Get recent active reports for a bus
   */
  static async getRecentReports(busId, expiryMinutes = 10) {
    try {
      const result = await pool.query(
        `SELECT sr.*, u.name, u.role, u.email
         FROM seat_reports sr
         JOIN users u ON sr.user_id = u.id
         WHERE sr.bus_id = $1 
         AND sr.is_active = true
         AND sr.timestamp > NOW() - INTERVAL '${expiryMinutes} minutes'
         ORDER BY sr.timestamp DESC`,
        [busId]
      );
      return result.rows;
    } catch (error) {
      throw new DatabaseError(`Failed to fetch seat reports: ${error.message}`);
    }
  }

  /**
   * Get aggregated seat status for a bus (majority voting)
   */
  static async getAggregatedStatus(busId, expiryMinutes = 10) {
    try {
      const result = await pool.query(
        `SELECT 
           status,
           COUNT(*) as count
         FROM seat_reports
         WHERE bus_id = $1
         AND is_active = true
         AND timestamp > NOW() - INTERVAL '${expiryMinutes} minutes'
         GROUP BY status
         ORDER BY count DESC
         LIMIT 1`,
        [busId]
      );

      if (result.rows.length === 0) {
        return { status: 'unknown', confidence: 0 };
      }

      const topStatus = result.rows[0];

      // Get total reports
      const totalResult = await pool.query(
        `SELECT COUNT(*) as total FROM seat_reports
         WHERE bus_id = $1
         AND is_active = true
         AND timestamp > NOW() - INTERVAL '${expiryMinutes} minutes'`,
        [busId]
      );

      const total = parseInt(totalResult.rows[0].total);
      const confidence = total > 0 ? topStatus.count / total : 0;

      return {
        status: topStatus.status,
        count: topStatus.count,
        total,
        confidence: Math.round(confidence * 100),
      };
    } catch (error) {
      throw new DatabaseError(`Failed to aggregate seat status: ${error.message}`);
    }
  }

  /**
   * Mark old reports as inactive (cleanup)
   */
  static async expireOldReports(expiryMinutes = 10) {
    try {
      const result = await pool.query(
        `UPDATE seat_reports
         SET is_active = false
         WHERE timestamp < NOW() - INTERVAL '${expiryMinutes} minutes'
         AND is_active = true
         RETURNING id`,
      );
      return result.rowCount;
    } catch (error) {
      throw new DatabaseError(`Failed to expire old reports: ${error.message}`);
    }
  }

  /**
   * Get all reports for a user
   */
  static async getUserReports(userId, limit = 100) {
    try {
      const result = await pool.query(
        `SELECT * FROM seat_reports
         WHERE user_id = $1
         ORDER BY timestamp DESC
         LIMIT $2`,
        [userId, limit]
      );
      return result.rows;
    } catch (error) {
      throw new DatabaseError(`Failed to fetch user reports: ${error.message}`);
    }
  }

  /**
   * Delete expired reports
   */
  static async deleteExpired(expiryMinutes = 10) {
    try {
      const result = await pool.query(
        `DELETE FROM seat_reports
         WHERE timestamp < NOW() - INTERVAL '${expiryMinutes} minutes'
         RETURNING id`,
      );
      return result.rowCount;
    } catch (error) {
      throw new DatabaseError(`Failed to delete expired reports: ${error.message}`);
    }
  }
}

export default SeatReport;
