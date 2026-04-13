import express from 'express';
import ETAController from '../controllers/ETAController.js';

const router = express.Router();

/**
 * @route   GET /api/eta/:busId
 * @desc    Get ETA for all stops
 * @access  Public
 */
router.get('/:busId', ETAController.getBusETA);

/**
 * @route   GET /api/eta/:busId/stop/:stopId
 * @desc    Get ETA to specific stop
 * @access  Public
 */
router.get('/:busId/stop/:stopId', ETAController.getETAToStop);

export default router;
