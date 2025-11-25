import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { userController } from '../controllers/userController';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/me', userController.getMe);
router.patch('/me', userController.updateProfile);
router.get('/me/stats', userController.getStats);

export default router;

