import { extractTokenFromHeader, verifyToken } from '../utils/jwt.js';
import { AuthenticationError, AuthorizationError } from '../utils/errors.js';
import User from '../models/User.js';

/**
 * Middleware to verify JWT token and attach user to request
 */
export async function authMiddleware(req, res, next) {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      throw new AuthenticationError('No authorization token provided');
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      throw new AuthenticationError('Invalid or expired token');
    }

    // Optional: verify user still exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return res.status(error.statusCode).json({
        error: error.message,
        code: 'AUTH_ERROR',
      });
    }
    res.status(401).json({ error: 'Authentication failed' });
  }
}

/**
 * Middleware to verify user is a driver
 */
export function requireDriver(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'driver') {
    throw new AuthorizationError(
      'Only drivers can access this resource'
    );
  }

  next();
}

/**
 * Middleware to verify user is a passenger
 */
export function requirePassenger(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'passenger') {
    throw new AuthorizationError(
      'Only passengers can access this resource'
    );
  }

  next();
}

/**
 * Middleware for optional authentication
 */
export async function optionalAuth(req, res, next) {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
        };
      }
    }
  } catch (error) {
    // Silent fail for optional auth
  }

  next();
}

/**
 * Error handling middleware
 */
export function errorHandler(err, req, res, next) {
  console.error('❌ Error:', err);

  // Handle operational errors
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.constructor.name,
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      code: 'JWT_ERROR',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired',
      code: 'TOKEN_EXPIRED',
    });
  }

  // Handle database errors
  if (err.code && err.code.startsWith('23')) {
    // PostgreSQL error codes
    return res.status(400).json({
      error: 'Database constraint violation',
      code: 'DB_CONSTRAINT_ERROR',
    });
  }

  // Generic error
  res.status(500).json({
    error: err.message || 'Internal server error',
    code: 'INTERNAL_ERROR',
  });
}

export default { authMiddleware, requireDriver, requirePassenger, optionalAuth, errorHandler };
