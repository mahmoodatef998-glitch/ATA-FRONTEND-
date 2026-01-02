# 🤖 AI Chatbot Setup Guide

## Overview

The ATA CRM system now includes an AI-powered chatbot using **Groq API** (free tier). The chatbot helps clients with:
- Product information (generators, ATS, switchgear)
- Order tracking
- Pricing and specifications
- Portal usage guidance
- General company questions

## Features

✅ **Free to use** - Groq API is completely free  
✅ **Fast responses** - Uses Llama 3.1 70B model  
✅ **Multi-language** - Supports Arabic and English  
✅ **Context-aware** - Remembers conversation history  
✅ **Rate limited** - Prevents abuse (100 requests per 15 minutes)

## Setup

### 1. Get Groq API Key

1. Visit [console.groq.com](https://console.groq.com)
2. Sign up for a free account (no credit card required)
3. Go to API Keys section
4. Create a new API key
5. Copy the key

### 2. Add to Environment Variables

Add to your `.env` file:

```env
GROQ_API_KEY=gsk_your_api_key_here
```

**For Vercel:**
1. Go to your Vercel project settings
2. Navigate to Environment Variables
3. Add `GROQ_API_KEY` with your key
4. Redeploy

### 3. Test the Chatbot

1. Start your development server: `npm run dev`
2. Navigate to Client Portal: `http://localhost:3000/client/portal`
3. Click the chat button (bottom right)
4. Try asking: "What products do you offer?"

## API Endpoint

### POST `/api/chat`

**Request:**
```json
{
  "message": "What is the status of my order?",
  "conversationHistory": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi! How can I help?" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reply": "I can help you check your order status...",
    "model": "llama-3.1-70b-versatile",
    "usage": {
      "prompt_tokens": 150,
      "completion_tokens": 50,
      "total_tokens": 200
    }
  }
}
```

## Rate Limiting

- **Limit:** 100 requests per 15 minutes per IP
- **Headers:** 
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp

## Customization

### Change System Prompt

Edit `app/api/chat/route.ts`:

```typescript
const systemPrompt = `Your custom prompt here...`;
```

### Change Model

Groq supports multiple models:
- `llama-3.1-70b-versatile` (default - best quality)
- `llama-3.1-8b-instant` (faster, lower quality)
- `mixtral-8x7b-32768` (alternative)

Change in `app/api/chat/route.ts`:

```typescript
model: "llama-3.1-8b-instant", // Faster model
```

### Adjust Response Length

Change `max_tokens` in the API call:

```typescript
max_tokens: 1000, // Longer responses
```

## Troubleshooting

### Chatbot not responding

1. Check `GROQ_API_KEY` is set in `.env`
2. Check API key is valid
3. Check browser console for errors
4. Check server logs

### Rate limit errors

- Wait 15 minutes or reduce request frequency
- Consider implementing user-based rate limiting

### Slow responses

- Try `llama-3.1-8b-instant` model (faster)
- Reduce `max_tokens`
- Check network connection

## Security

- ✅ Input sanitization
- ✅ Rate limiting
- ✅ Message length limits (1000 chars)
- ✅ Error handling
- ✅ No sensitive data in prompts

## Cost

**Groq API: FREE** 🎉

- No credit card required
- Unlimited requests (with rate limits)
- Perfect for production use

## Future Enhancements

- [ ] Order status integration (query real orders)
- [ ] Product catalog integration
- [ ] Multi-language detection
- [ ] Chat history persistence
- [ ] Admin chat analytics



