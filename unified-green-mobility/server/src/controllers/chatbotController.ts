import { Response } from 'express';
import { supabaseAdmin } from '../config/supabaseClient';
import { AuthRequest } from '../middleware/authMiddleware';
import { config } from '../config/env';

/**
 * Simple RAG chatbot using Supabase Vector and Google Gemini
 */
export const chatbotController = {
  async query(req: AuthRequest, res: Response) {
    try {
      const { message, userId } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Step 1: Embed the user message (optional - falls back if fails)
      const embedding = await embedText(message);
      let similarDocs: any[] | null = null;

      // Step 2: Vector similarity search (if embedding succeeded)
      if (embedding) {
        const { data, error: searchError } = await supabaseAdmin.rpc(
          'match_documents',
          {
            query_embedding: embedding,
            match_threshold: 0.7,
            match_count: 3,
          }
        );

        if (!searchError && data) {
          similarDocs = data;
        }
      }

      // Fallback: simple text search if vector search fails or embedding unavailable
      if (!similarDocs || similarDocs.length === 0) {
        const { data: docs } = await supabaseAdmin
          .from('kb_documents')
          .select('*')
          .limit(3);

        const context = docs?.map(d => d.content).join('\n\n') || '';

        // Generate response with or without LLM
        let answer: string;
        if (config.geminiApiKey) {
          answer = await generateAnswerWithGemini(message, context);
        } else {
          answer = generateSimpleResponse(message, context);
        }

        return res.json({ answer, sources: docs || [] });
      }

      // Step 3: Build context from retrieved documents
      const context = similarDocs?.map((doc: any) => doc.content || doc.chunk_text).join('\n\n') || '';

      // Step 4: Generate answer using Google Gemini (if available) or simple response
      let answer: string;
      if (config.geminiApiKey) {
        answer = await generateAnswerWithGemini(message, context);
      } else {
        answer = generateSimpleResponse(message, context);
      }

      res.json({
        answer,
        sources: similarDocs?.map((doc: any) => ({
          title: doc.title || 'Document',
          content: doc.content || doc.chunk_text,
        })) || [],
      });
    } catch (error: any) {
      console.error('Chatbot query error:', error);
      res.status(500).json({ error: 'Failed to process query' });
    }
  },
};

/**
 * Embed text using Google's text-embedding model (or fallback)
 */
async function embedText(text: string): Promise<number[] | null> {
  if (!config.geminiApiKey) {
    // Fallback: return null to use simple search
    return null;
  }

  try {
    // Using Google's text-embedding-004 model
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${config.geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'models/text-embedding-004',
          content: {
            parts: [{ text: text }],
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Embedding API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    // Google returns embedding in data.embedding.values
    return data.embedding?.values || null;
  } catch (error) {
    console.error('Embedding error:', error);
    return null;
  }
}

/**
 * Generate answer using Google Gemini
 */
async function generateAnswerWithGemini(question: string, context: string): Promise<string> {
  try {
    const prompt = `You are a helpful assistant for a Green Mobility Platform. Answer questions based on the provided context. If the context does not contain the answer, say so politely.

Context:
${context}

Question: ${question}

Please provide a helpful and concise answer:`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${config.geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 300,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      return generateSimpleResponse(question, context);
    }

    const data = await response.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!answer) {
      console.error('No answer in Gemini response:', data);
      return generateSimpleResponse(question, context);
    }

    return answer.trim();
  } catch (error) {
    console.error('Gemini API error:', error);
    return generateSimpleResponse(question, context);
  }
}

/**
 * Simple response generator (fallback when Gemini is not available)
 */
function generateSimpleResponse(question: string, context: string): string {
  const lowerQuestion = question.toLowerCase();

  // Simple keyword matching
  if (lowerQuestion.includes('kyc') || lowerQuestion.includes('verification')) {
    return 'KYC (Know Your Customer) verification is required to use certain features like creating or joining rides. You can submit your KYC documents in your profile page, and an admin will review them.';
  }

  if (lowerQuestion.includes('ride') || lowerQuestion.includes('carpool')) {
    return 'You can search for available rides or create your own ride. Drivers need KYC approval. Passengers receive an OTP when accepted, which must be verified before the ride starts.';
  }

  if (lowerQuestion.includes('parking')) {
    return 'You can search for available parking spots on the parking map. Select a spot and make a reservation for your desired time slot.';
  }

  if (lowerQuestion.includes('points') || lowerQuestion.includes('reward')) {
    return 'You earn points by completing rides: 20 points as a driver, 10 points as a passenger. Points can be redeemed for coupons in the rewards section.';
  }

  if (lowerQuestion.includes('sos') || lowerQuestion.includes('emergency')) {
    return 'If you need emergency assistance, use the SOS button in the active ride view. This will alert our support team with your location.';
  }

  if (context) {
    // Return relevant snippet from context
    const sentences = context.split(/[.!?]+/).filter(s => s.trim().length > 20);
    if (sentences.length > 0) {
      return sentences[0].trim() + '.';
    }
  }

  return 'I can help you with questions about ride sharing, parking, KYC verification, rewards, and safety features. Please ask a specific question.';
}

