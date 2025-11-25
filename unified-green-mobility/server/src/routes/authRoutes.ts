import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { authController } from '../controllers/authController';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.getMe);

// Admin MFA routes
router.post('/admin/request-otp', authMiddleware, authController.requestAdminOTP);
router.post('/admin/verify-otp', authMiddleware, authController.verifyAdminOTP);

export default router;
