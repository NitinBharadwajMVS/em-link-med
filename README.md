# MediXpress

MediXpress is an ambulance-hospital coordination platform for prehospital emergency communication.

## Hospital Recommendation AI

This project integrates Groq AI for intelligent hospital recommendations based on patient vitals, triage level, and hospital capabilities.

### Configuration

The Groq API key is currently configured in `supabase/functions/config/keys.ts` for development purposes.

To add your Groq API key:
1. Open `supabase/functions/config/keys.ts`
2. Replace `"your_groq_api_key_here"` with your actual Groq API key
3. Get a free API key from https://console.groq.com

### Switching to Environment Variables

Once environment variables are available in your deployment, you can migrate to using `GROQ_API_KEY` from environment variables or Supabase secrets.

```typescript
const apiKey = Deno.env.get("GROQ_API_KEY") || GROQ_API_KEY;
```

No code changes are required. Add `GROQ_API_KEY` to your runtime environment and the system will use it automatically.

### Features

- AI-powered hospital recommendations
- Deterministic fallback mode if AI is unavailable
- Confidence scores with recommendation reasoning
- Equipment and specialty matching

## Local Development

Requirements:
- Node.js 18+
- npm

Run locally:

```sh
npm install
npm run dev
```

Build for production:

```sh
npm run build
npm run preview
```

## Tech Stack

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase
