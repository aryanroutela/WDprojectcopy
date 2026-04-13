import express from 'express';
import BusController from '../controllers/BusController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/buses
 * @desc    Get all active buses
 * @access  Public
 */
router.get('/', BusController.getAllBuses);

/**
 * @route   GET /api/buses/:id
 * @desc    Get specific bus details
 * @access  Public
 */
router.get('/:id', BusController.getBusDetails);

/**
 * @route   GET /api/buses/route/:routeId
 * @desc    Get buses for a route
 * @access  Public
 */
router.get('/route/:routeId', BusController.getBusByRoute);

/**
 * @route   GET /api/buses/current
 * @desc    Get current bus for authenticated user
 * @access  Private
 */
router.get('/current', authMiddleware, BusController.getUserCurrentBus);

/**
 * @route   POST /api/buses/:id/close
 * @desc    Close bus session
 * @access  Private (Driver only)
 */
router.post('/:id/close', authMiddleware, BusController.closeBusSession);

export default router;
