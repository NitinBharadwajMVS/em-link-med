# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/619608cc-0c1e-4f11-a9b0-97bdd618ac85

## Hospital Recommendation AI

This project integrates Groq AI for intelligent hospital recommendations based on patient vitals, triage level, and hospital capabilities.

### Configuration

The Groq API key is currently configured in `/supabase/functions/config/keys.ts` for development purposes. 

To add your Groq API key:
1. Open `supabase/functions/config/keys.ts`
2. Replace `"your_groq_api_key_here"` with your actual Groq API key
3. Get a free API key from [https://console.groq.com](https://console.groq.com)

### Switching to Environment Variables

Once environment variables become available in your deployment, you can migrate to using `GROQ_API_KEY` from `process.env` or Supabase secrets:

```typescript
// The edge function automatically checks env vars first:
const apiKey = Deno.env.get('GROQ_API_KEY') || GROQ_API_KEY;
```

No code changes are required - just add the `GROQ_API_KEY` to your Supabase secrets or environment variables, and the system will automatically use it instead of the config file.

### Features

- **AI-Powered Recommendations**: Uses Groq's Llama 3.3 70B model to analyze patient conditions and recommend optimal hospitals
- **Graceful Fallback**: Automatically switches to deterministic algorithm if API key is missing or API fails
- **Visual Indicators**: Shows "🤖 AI Recommendation Active" when using AI, or "⚡ Offline Recommendation Mode" for fallback
- **Confidence Scores**: Each recommendation includes a confidence percentage and detailed reasoning
- **Equipment Matching**: Considers required medical equipment and hospital specialties

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/619608cc-0c1e-4f11-a9b0-97bdd618ac85) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/619608cc-0c1e-4f11-a9b0-97bdd618ac85) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
