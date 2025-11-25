import express from 'express';
import { chatbotController } from '../controllers/chatbotController';

const router = express.Router();

// Chatbot is public (no auth required for now, can add rate limiting later)
router.post('/query', chatbotController.query);

export default router;

