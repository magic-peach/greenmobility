/**
 * Chat API Route
 * 
 * Handles chat messages and proxies to Google Gemini API.
 * 
 * Request body:
 * {
 *   "message": "User message here",
 *   "context"?: [...] // Optional context array
 * }
 * 
 * Response:
 * {
 *   "reply": "Assistant response"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM_PROMPT = `You are a helpful assistant for a Green Mobility Platform. You help users with:

- Ride sharing flow: How to search, create, or join rides
- KYC process: Document submission and verification
- Safety features: SOS button, emergency contacts, support tickets
- Parking reservations: Finding and reserving parking spots
- Rewards and leaderboard: Points system, coupons, and rankings

Be friendly, concise, and focused on helping users navigate the platform. If you don't know something, politely say so and suggest contacting support.`;

export async function POST(request: NextRequest) {
  try {
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { message, context } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Build prompt with context if provided
    let prompt = SYSTEM_PROMPT;
    if (context && Array.isArray(context) && context.length > 0) {
      prompt += `\n\nRelevant context:\n${context.join('\n')}`;
    }
    prompt += `\n\nUser question: ${message}\n\nPlease provide a helpful answer:`;

    // Generate response
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const reply = response.text();

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response', details: error.message },
      { status: 500 }
    );
  }
}

