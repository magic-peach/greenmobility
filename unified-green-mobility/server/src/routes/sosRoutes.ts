import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { sosController } from '../controllers/sosController';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.post('/', sosController.createSOS);
router.get('/my', sosController.getMySOS);

export default router;

