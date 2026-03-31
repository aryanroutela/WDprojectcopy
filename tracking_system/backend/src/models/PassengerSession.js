import pool from '../utils/database.js';
import { DatabaseError } from '../utils/errors.js';

export class PassengerSession {
  /**
   * Create a new passenger session (user joins bus)
   */
  static async create(userId, busId) {
    try {
      const result = await pool.query(
        `INSERT INTO passenger_sessions (user_id, bus_id, is_active)
         VALUES ($1, $2, true)
         RETURNING id, user_id, bus_id, joined_at, is_active`,
        [userId, busId]
      );
      return result.rows[0];
    } catch (error) {
      throw new DatabaseError(`Failed to create passenger session: ${error.message}`);
    }
  }

  /**
   * Find active session for user
   */
  static async findActiveSession(userId) {
    try {
      const result = await pool.query(
        `SELECT * FROM passenger_sessions
         WHERE user_id = $1 AND is_active = true
         ORDER BY joined_at DESC LIMIT 1`,
        [userId]
      );
      return result.rows[0];
    } catch (error) {
      throw new DatabaseError(`Failed to find passenger session: ${error.message}`);
    }
  }

  /**
   * Find all active passengers on a bus
   */
  static async findByBusId(busId) {
    try {
      const result = await pool.query(
        `SELECT ps.*, u.name, u.email, u.role
         FROM passenger_sessions ps
         JOIN users u ON ps.user_id = u.id
         WHERE ps.bus_id = $1 AND ps.is_active = true`,
        [busId]
      );
      return result.rows;
    } catch (error) {
      throw new DatabaseError(`Failed to fetch passengers: ${error.message}`);
    }
  }

  /**
   * End passenger session (user leaves bus)
   */
  static async endSession(sessionId) {
    try {
      const result = await pool.query(
        `UPDATE passenger_sessions
         SET is_active = false, left_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [sessionId]
      );
      return result.rows[0];
    } catch (error) {
      throw new DatabaseError(`Failed to end passenger session: ${error.message}`);
    }
  }

  /**
   * Check if user is on a specific bus
   */
  static async isUserOnBus(userId, busId) {
    try {
      const result = await pool.query(
        `SELECT COUNT(*) as count FROM passenger_sessions
         WHERE user_id = $1 AND bus_id = $2 AND is_active = true`,
        [userId, busId]
      );
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      throw new DatabaseError(`Failed to check passenger status: ${error.message}`);
    }
  }

  /**
   * Get all sessions for a user
   */
  static async getUserSessions(userId) {
    try {
      const result = await pool.query(
        `SELECT * FROM passenger_sessions
         WHERE user_id = $1
         ORDER BY joined_at DESC`,
        [userId]
      );
      return result.rows;
    } catch (error) {
      throw new DatabaseError(`Failed to fetch user sessions: ${error.message}`);
    }
  }

  /**
   * Remove passenger from bus
   */
  static async removeFromBus(userId, busId) {
    try {
      await pool.query(
        `UPDATE passenger_sessions
         SET is_active = false, left_at = CURRENT_TIMESTAMP
         WHERE user_id = $1 AND bus_id = $2 AND is_active = true`,
        [userId, busId]
      );
      return true;
    } catch (error) {
      throw new DatabaseError(`Failed to remove passenger: ${error.message}`);
    }
  }
}

export default PassengerSession;
