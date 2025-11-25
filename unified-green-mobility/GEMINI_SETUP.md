# Google Gemini API Setup

## Environment Variables

Add to your `server/.env` file:

```env
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
```

## Getting Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key
5. Add it to your `.env` file

## API Models Used

### Chat Completions
- **Model**: `gemini-pro`
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`
- **Use Case**: Generating conversational responses for the chatbot

### Text Embeddings
- **Model**: `text-embedding-004`
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent`
- **Use Case**: Creating vector embeddings for RAG (Retrieval Augmented Generation)
- **Dimension**: 768 (updated in migration)

## Migration Update Required

The embedding dimension has been changed from 1536 (OpenAI) to 768 (Google). If you've already run the migration, you may need to update the vector column:

```sql
-- Update existing embeddings table if needed
ALTER TABLE kb_embeddings 
  ALTER COLUMN embedding TYPE vector(768);
```

## Testing

After setting up the API key, test the chatbot endpoint:

```bash
POST /api/chatbot/query
{
  "message": "How does KYC verification work?"
}
```

## Fallback Behavior

If the Gemini API key is not configured or there's an error:
- The system will fall back to simple keyword-based responses
- Vector search will be skipped and simple text search will be used
- The chatbot will still work, just with less sophisticated responses

## Rate Limits

Google Gemini API has rate limits:
- Free tier: 15 requests per minute
- Paid tier: Higher limits

Consider implementing rate limiting in production.

