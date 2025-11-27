import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { parkingController } from '../controllers/parkingController';

const router = express.Router();

// Public routes
router.get('/lots', parkingController.getParkingLots);
router.get('/lots/:id/spots', parkingController.getParkingSpots);
router.get('/prediction', parkingController.getParkingPrediction);

// Protected routes
router.use(authMiddleware);

router.post('/reservations', parkingController.createReservation);
router.get('/reservations/my', parkingController.getMyReservations);
router.post('/reservations/:id/payment', parkingController.updatePayment);
router.patch('/reservations/:id/cancel', parkingController.cancelReservation);
router.patch('/reservations/:id/complete', parkingController.completeReservation);
router.get('/reservations/:id', parkingController.getReservationById);

export default router;
