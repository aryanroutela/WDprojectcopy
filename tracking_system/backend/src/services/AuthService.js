import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwt.js';
import User from '../models/User.js';
import {
  AuthenticationError,
  ConflictError,
  ValidationError,
} from '../utils/errors.js';
import {
  isValidEmail,
  isValidPassword,
  isValidRole,
} from '../utils/validation.js';

export class AuthService {
  /**
   * Register a new user
   */
  static async register(name, email, password, role) {
    // Validate input
    if (!isValidEmail(email)) {
      throw new ValidationError('Invalid email format');
    }

    if (!isValidPassword(password)) {
      throw new ValidationError('Password must be at least 6 characters');
    }

    if (!isValidRole(role)) {
      throw new ValidationError('Invalid role. Must be passenger or driver');
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create(name, email, hashedPassword, role);

    // Generate token
    const token = generateToken(user.id, user.email, user.role);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Login user
   */
  static async login(email, password) {
    // Validate input
    if (!isValidEmail(email)) {
      throw new ValidationError('Invalid email format');
    }

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Compare passwords
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Generate token
    const token = generateToken(user.id, user.email, user.role);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Get current user info
   */
  static async getCurrentUser(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AuthenticationError('User not found');
    }
    return user;
  }
}

export default AuthService;
