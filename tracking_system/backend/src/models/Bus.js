import pool from '../utils/database.js';
import { DatabaseError } from '../utils/errors.js';

export class Bus {
  /**
   * Create an active bus session
   */
  static async create(routeId, sessionId, lat, lng) {
    try {
      const result = await pool.query(
        `INSERT INTO active_buses (route_id, session_id, current_lat, current_lng, is_active)
         VALUES ($1, $2, $3, $4, true)
         RETURNING id, route_id, session_id, current_lat, current_lng, avg_speed, last_updated, is_active`,
        [routeId, sessionId, lat, lng]
      );
      return result.rows[0];
    } catch (error) {
      throw new DatabaseError(`Failed to create bus session: ${error.message}`);
    }
  }

  /**
   * Find bus by ID
   */
  static async findById(id) {
    try {
      const result = await pool.query(
        `SELECT * FROM active_buses WHERE id = $1`,
        [id]
      );
      return result.rows[0];
    } catch (error) {
      throw new DatabaseError(`Failed to find bus: ${error.message}`);
    }
  }

  /**
   * Find bus by session ID
   */
  static async findBySessionId(sessionId) {
    try {
      const result = await pool.query(
        `SELECT * FROM active_buses WHERE session_id = $1 AND is_active = true`,
        [sessionId]
      );
      return result.rows[0];
    } catch (error) {
      throw new DatabaseError(`Failed to find bus: ${error.message}`);
    }
  }

  /**
   * Get all active buses
   */
  static async getAllActive() {
    try {
      const result = await pool.query(
        `SELECT ab.*, r.name as route_name, r.number as route_number
         FROM active_buses ab
         JOIN routes r ON ab.route_id = r.id
         WHERE ab.is_active = true
         ORDER BY ab.last_updated DESC`
      );
      return result.rows;
    } catch (error) {
      throw new DatabaseError(`Failed to fetch active buses: ${error.message}`);
    }
  }

  /**
   * Get buses for a specific route
   */
  static async getByRouteId(routeId) {
    try {
      const result = await pool.query(
        `SELECT * FROM active_buses WHERE route_id = $1 AND is_active = true`,
        [routeId]
      );
      return result.rows;
    } catch (error) {
      throw new DatabaseError(`Failed to fetch buses: ${error.message}`);
    }
  }

  /**
   * Update bus location and speed
   */
  static async updateLocation(busId, lat, lng, speed) {
    try {
      const result = await pool.query(
        `UPDATE active_buses
         SET current_lat = $1, current_lng = $2, avg_speed = $3, last_updated = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING *`,
        [lat, lng, speed, busId]
      );
      return result.rows[0];
    } catch (error) {
      throw new DatabaseError(`Failed to update bus location: ${error.message}`);
    }
  }

  /**
   * Get passenger count for a bus
   */
  static async getPassengerCount(busId) {
    try {
      const result = await pool.query(
        `SELECT COUNT(*) as count FROM passenger_sessions
         WHERE bus_id = $1 AND is_active = true`,
        [busId]
      );
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw new DatabaseError(`Failed to get passenger count: ${error.message}`);
    }
  }

  /**
   * Close active bus session (end of route)
   */
  static async closeSession(busId) {
    try {
      // Mark all active passengers as left
      await pool.query(
        `UPDATE passenger_sessions
         SET is_active = false, left_at = CURRENT_TIMESTAMP
         WHERE bus_id = $1 AND is_active = true`,
        [busId]
      );

      // Close the bus
      const result = await pool.query(
        `UPDATE active_buses
         SET is_active = false, last_updated = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [busId]
      );
      return result.rows[0];
    } catch (error) {
      throw new DatabaseError(`Failed to close bus session: ${error.message}`);
    }
  }

  /**
   * Delete bus (cleanup)
   */
  static async delete(id) {
    try {
      await pool.query(`DELETE FROM active_buses WHERE id = $1`, [id]);
      return true;
    } catch (error) {
      throw new DatabaseError(`Failed to delete bus: ${error.message}`);
    }
  }

  /**
   * Update current stop index
   */
  static async updateCurrentStop(busId, stopIndex) {
    try {
      const result = await pool.query(
        `UPDATE active_buses
         SET current_stop_index = $1
         WHERE id = $2
         RETURNING *`,
        [stopIndex, busId]
      );
      return result.rows[0];
    } catch (error) {
      throw new DatabaseError(`Failed to update current stop: ${error.message}`);
    }
  }
}

export default Bus;
