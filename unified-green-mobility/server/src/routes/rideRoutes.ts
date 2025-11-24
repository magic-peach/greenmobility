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
router.post('/:rideId/join', rideController.joinRide);
router.patch('/:rideId/passengers/:passengerId', rideController.updatePassengerStatus);
router.get('/:id/locations', rideController.getRideLocations);
router.post('/:id/locations', rideController.updateRideLocation);
router.get('/:id/messages', rideController.getRideMessages);
router.post('/:id/messages', rideController.sendMessage);
router.get('/:id/demand', rideController.getRideDemand);

export default router;
