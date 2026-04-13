import AuthService from '../services/AuthService.js';
import { validateRegistration, validateLogin } from '../utils/validation.js';
import { ValidationError } from '../utils/errors.js';

export class AuthController {
  /**
   * Register new user
   * POST /api/auth/register
   */
  static async register(req, res, next) {
    try {
      const { name, email, password, role } = req.body;

      // Validate input
      const validation = validateRegistration({ name, email, password, role });
      if (!validation.isValid) {
        throw new ValidationError(validation.errors.join('; '));
      }

      const result = await AuthService.register(name, email, password, role);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Validate input
      const validation = validateLogin({ email, password });
      if (!validation.isValid) {
        throw new ValidationError(validation.errors.join('; '));
      }

      const result = await AuthService.login(email, password);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user
   * GET /api/auth/me
   */
  static async getCurrentUser(req, res, next) {
    try {
      const user = await AuthService.getCurrentUser(req.user.userId);

      res.status(200).json({
        success: true,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.created_at,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
