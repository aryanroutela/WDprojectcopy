import pool from '../utils/database.js';
import { DatabaseError } from '../utils/errors.js';

export class Route {
  /**
   * Create a new route
   */
  static async create(name, number, description, waypoints) {
    try {
      const result = await pool.query(
        `INSERT INTO routes (name, number, description, waypoints)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, number, description, waypoints, is_active, created_at`,
        [name, number, description, JSON.stringify(waypoints)]
      );
      return result.rows[0];
    } catch (error) {
      throw new DatabaseError(`Failed to create route: ${error.message}`);
    }
  }

  /**
   * Find route by ID
   */
  static async findById(id) {
    try {
      const result = await pool.query(
        `SELECT * FROM routes WHERE id = $1`,
        [id]
      );
      return result.rows[0];
    } catch (error) {
      throw new DatabaseError(`Failed to find route: ${error.message}`);
    }
  }

  /**
   * Find route by number
   */
  static async findByNumber(number) {
    try {
      const result = await pool.query(
        `SELECT * FROM routes WHERE number = $1`,
        [number]
      );
      return result.rows[0];
    } catch (error) {
      throw new DatabaseError(`Failed to find route: ${error.message}`);
    }
  }

  /**
   * Get all active routes
   */
  static async getAll(activeOnly = true) {
    try {
      let query = 'SELECT * FROM routes';
      if (activeOnly) {
        query += ' WHERE is_active = true';
      }
      query += ' ORDER BY number ASC';

      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      throw new DatabaseError(`Failed to fetch routes: ${error.message}`);
    }
  }

  /**
   * Get stops for a route
   */
  static async getStops(routeId) {
    try {
      const result = await pool.query(
        `SELECT * FROM stops WHERE route_id = $1 ORDER BY stop_order ASC`,
        [routeId]
      );
      return result.rows;
    } catch (error) {
      throw new DatabaseError(`Failed to fetch stops: ${error.message}`);
    }
  }

  /**
   * Update route
   */
  static async update(id, data) {
    try {
      const fields = [];
      const values = [];
      let paramCount = 1;

      if (data.name) {
        fields.push(`name = $${paramCount++}`);
        values.push(data.name);
      }
      if (data.description) {
        fields.push(`description = $${paramCount++}`);
        values.push(data.description);
      }
      if (data.is_active !== undefined) {
        fields.push(`is_active = $${paramCount++}`);
        values.push(data.is_active);
      }

      values.push(id);
      fields.push(`updated_at = CURRENT_TIMESTAMP`);

      const query = `UPDATE routes SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new DatabaseError(`Failed to update route: ${error.message}`);
    }
  }

  /**
   * Delete route
   */
  static async delete(id) {
    try {
      await pool.query(`DELETE FROM routes WHERE id = $1`, [id]);
      return true;
    } catch (error) {
      throw new DatabaseError(`Failed to delete route: ${error.message}`);
    }
  }
}

export default Route;
