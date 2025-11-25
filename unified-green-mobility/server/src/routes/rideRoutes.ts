import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { rideController } from '../controllers/rideController';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.post('/', rideController.createRide);
router.get('/search', rideController.searchRides);
router.get('/my', rideController.getMyRides);
router.get('/my-joined', rideController.getMyJoinedRides);
router.get('/:id', rideController.getRideById);
router.post('/:rideId/request', rideController.requestRide);
router.post('/:rideId/join', rideController.joinRide);
router.post('/:rideId/passengers/:passengerId/accept', rideController.acceptPassenger);
router.post('/:rideId/passengers/:passengerId/reject', rideController.rejectPassenger);
router.post('/:rideId/passengers/:passengerId/verify-otp', rideController.verifyOTP);
router.post('/:rideId/start', rideController.startRide);
router.post('/:rideId/complete', rideController.completeRide);
router.post('/:rideId/close', rideController.closeRide);
router.patch('/:rideId/passengers/:passengerId', rideController.updatePassengerStatus);
router.get('/:id/locations', rideController.getRideLocations);
router.post('/:id/location', rideController.updateRideLocation);
router.get('/:id/eta', rideController.getETA);
router.get('/:id/messages', rideController.getRideMessages);
router.post('/:id/messages', rideController.sendMessage);
router.get('/:id/demand', rideController.getRideDemand);
router.get('/:rideId/payments', rideController.getPayments);
router.post('/:rideId/pay', rideController.markPayment);
router.post('/:rideId/confirm-payment/:passengerId', rideController.confirmPayment);

export default router;
