import express from 'express';
import RouteController from '../controllers/RouteController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/routes
 * @desc    Get all routes
 * @access  Public
 */
router.get('/', RouteController.getAllRoutes);

/**
 * @route   POST /api/routes
 * @desc    Create new route
 * @access  Private (Admin/Driver)
 */
router.post('/', authMiddleware, RouteController.createRoute);

/**
 * @route   GET /api/routes/:id
 * @desc    Get route details
 * @access  Public
 */
router.get('/:id', RouteController.getRouteDetails);

/**
 * @route   PATCH /api/routes/:id
 * @desc    Update route
 * @access  Private (Admin/Driver)
 */
router.patch('/:id', authMiddleware, RouteController.updateRoute);

/**
 * @route   GET /api/stops/:routeId
 * @desc    Get stops for route
 * @access  Public
 */
router.get('/:routeId/stops', RouteController.getRouteStops);

export default router;
