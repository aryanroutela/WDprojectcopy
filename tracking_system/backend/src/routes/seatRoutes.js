import express from 'express';
import SeatController from '../controllers/SeatController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/seats/report
 * @desc    Report seat availability
 * @access  Private (Drivers & Passengers on bus)
 */
router.post('/report', authMiddleware, SeatController.reportSeatAvailability);

/**
 * @route   GET /api/seats/:busId
 * @desc    Get aggregated seat status
 * @access  Public
 */
router.get('/:busId', SeatController.getSeatStatus);

/**
 * @route   GET /api/seats/:busId/reports
 * @desc    Get detailed seat reports
 * @access  Public
 */
router.get('/:busId/reports', SeatController.getBusReports);

/**
 * @route   GET /api/seats/history/me
 * @desc    Get user's reporting history
 * @access  Private
 */
router.get('/history/me', authMiddleware, SeatController.getUserHistory);

export default router;
