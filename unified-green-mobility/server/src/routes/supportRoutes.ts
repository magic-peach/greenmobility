import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { adminMiddleware } from '../middleware/adminMiddleware';
import { supportController } from '../controllers/supportController';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.post('/', supportController.createTicket);
router.get('/my', supportController.getMyTickets);

// Admin routes
router.get('/all', adminMiddleware, supportController.getAllTickets);
router.patch('/:id/status', adminMiddleware, supportController.updateTicketStatus);

export default router;

