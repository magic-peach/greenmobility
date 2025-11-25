import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { adminMiddleware } from '../middleware/adminMiddleware';
import { kycController } from '../controllers/kycController';

const router = express.Router();

// Submit KYC (authenticated users)
router.post('/submit', authMiddleware, kycController.submitKYC);

// Admin routes
router.get('/pending', authMiddleware, adminMiddleware, kycController.getPendingKYC);
router.post('/:id/approve', authMiddleware, adminMiddleware, kycController.approveKYC);
router.post('/:id/reject', authMiddleware, adminMiddleware, kycController.rejectKYC);

export default router;

