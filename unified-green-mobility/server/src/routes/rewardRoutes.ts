import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { rewardController } from '../controllers/rewardController';

const router = express.Router();

router.get('/leaderboard', rewardController.getLeaderboard);
router.get('/my-stats', authMiddleware, rewardController.getMyStats);
router.get('/my-rewards', authMiddleware, rewardController.getMyRewards);

export default router;
