import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { couponController } from '../controllers/couponController';

const router = express.Router();

// Public route - list coupons
router.get('/', couponController.getCoupons);

// Authenticated routes
router.use(authMiddleware);
router.post('/:couponId/redeem', couponController.redeemCoupon);
router.get('/my', couponController.getMyCoupons);

export default router;

