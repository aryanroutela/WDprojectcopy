import pool from '../utils/database.js';
import { DatabaseError } from '../utils/errors.js';

export class User {
  /**
   * Create a new user
   */
  static async create(name, email, hashedPassword, role) {
    try {
      const result = await pool.query(
        `INSERT INTO users (name, email, password, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email, role, created_at`,
        [name, email, hashedPassword, role]
      );
      return result.rows[0];
    } catch (error) {
      throw new DatabaseError(`Failed to create user: ${error.message}`);
    }
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    try {
      const result = await pool.query(
        `SELECT * FROM users WHERE email = $1`,
        [email]
      );
      return result.rows[0];
    } catch (error) {
      throw new DatabaseError(`Failed to find user: ${error.message}`);
    }
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    try {
      const result = await pool.query(
        `SELECT id, name, email, role, created_at FROM users WHERE id = $1`,
        [id]
      );
      return result.rows[0];
    } catch (error) {
      throw new DatabaseError(`Failed to find user: ${error.message}`);
    }
  }

  /**
   * Get all users
   */
  static async getAll() {
    try {
      const result = await pool.query(
        `SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC`
      );
      return result.rows;
    } catch (error) {
      throw new DatabaseError(`Failed to fetch users: ${error.message}`);
    }
  }

  /**
   * Update user
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
      if (data.email) {
        fields.push(`email = $${paramCount++}`);
        values.push(data.email);
      }
      if (data.role) {
        fields.push(`role = $${paramCount++}`);
        values.push(data.role);
      }

      values.push(id);
      fields.push(`updated_at = CURRENT_TIMESTAMP`);

      const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new DatabaseError(`Failed to update user: ${error.message}`);
    }
  }

  /**
   * Delete user
   */
  static async delete(id) {
    try {
      await pool.query(`DELETE FROM users WHERE id = $1`, [id]);
      return true;
    } catch (error) {
      throw new DatabaseError(`Failed to delete user: ${error.message}`);
    }
  }
}

export default User;
