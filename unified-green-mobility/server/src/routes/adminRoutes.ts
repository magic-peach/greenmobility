import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { adminMiddleware } from '../middleware/adminMiddleware';
import { adminController } from '../controllers/adminController';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/users', adminController.getUsers);
router.get('/parking-lots', adminController.getParkingLots);
router.get('/rides', adminController.getRides);
router.get('/analytics/traffic', adminController.getTrafficAnalytics);
router.get('/analytics/parking-usage', adminController.getParkingUsageAnalytics);
router.get('/analytics/co2-saved', adminController.getCO2SavedAnalytics);

export default router;
