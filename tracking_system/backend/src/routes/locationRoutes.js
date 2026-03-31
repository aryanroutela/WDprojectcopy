import express from 'express';
import LocationController from '../controllers/LocationController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/location/update
 * @desc    Update user location
 * @access  Private
 */
router.post('/update', authMiddleware, LocationController.updateLocation);

/**
 * @route   GET /api/location/status
 * @desc    Get user's location status
 * @access  Private
 */
router.get('/status', authMiddleware, LocationController.getLocationStatus);

/**
 * @route   POST /api/location/exit-bus
 * @desc    Remove user from bus
 * @access  Private
 */
router.post('/exit-bus', authMiddleware, LocationController.exitBus);

export default router;
