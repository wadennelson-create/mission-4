# Mission 4: Turners Insurance AI Backend

Express API for Tina, a generative AI insurance consultant that recommends Turners car insurance products from a chat conversation.

The main endpoint sends the conversation to Google Gemini when `GEMINI_API_KEY` is configured. If no key is present, the endpoint returns a small local fallback response so the application can still be demonstrated.

## Run Locally

```bash
npm install
npm start
```

For development with automatic reload:

```bash
npm run dev
```

By default, the API runs at:

```text
http://localhost:5000
```

Create or update `.env`:

```text
PORT=5000
GEMINI_API_KEY=your_gemini_key_here
GEMINI_MODEL=gemini-3.5-flash
```

## Endpoints

```http
GET /
POST /api/insurance-chat
POST /api/race-analysis
POST /api/risk-rating
```

## Insurance Chat Request

```json
{
  "messages": [
    {
      "role": "assistant",
      "content": "I'm Tina. I help you choose the right insurance policy..."
    },
    {
      "role": "user",
      "content": "Yes, I drive a 6 year old hatchback and want cover for my car."
    }
  ]
}
```

## Insurance Chat Response

```json
{
  "reply": "Thanks. Do you also want protection against unexpected mechanical repair costs?",
  "source": "gemini-3.5-flash"
}
```

## Tests

```bash
npm test
```
