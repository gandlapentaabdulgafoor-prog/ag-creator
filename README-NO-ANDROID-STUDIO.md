# ONEAG — No Android Studio workflow

The primary app is the React/Vite web application in this repository.

## Local development

Requirements: Node.js 20+ and npm/bun.

```bash
npm install
npm run dev
```

Open the local URL printed by the server.

## Production build

```bash
npm run build
npm start
```

The app is configured for Firebase Hosting with `dist` as the hosting directory.

## PWA

ONEAG now includes a web manifest and service worker so the web app can be installed from a supported mobile browser as a standalone app. Authentication, Firestore, referral attribution, and affiliate APIs still require network access.

## Referral link

Referral URLs use the current browser origin automatically, so links generated from a deployed domain follow that domain rather than a hard-coded development host.

## AG Creator AI workflows

The web app opens in AG Creator and keeps the existing ONEAG rewards and referral sections available from the navigation. For local generation, put your Gemini key in `GEMINI_API_KEY` in a root `.env` file (copy the variable name from `.env.example`). The Express server loads this file with `dotenv`; never use a `VITE_` variable for the key. For deployment, configure `GEMINI_API_KEY` in the server process's secret/environment settings. Firebase-authenticated requests are verified by the Express API against the existing Firebase project. Image generation uses Gemini image generation, and creator text workflows use Gemini text generation. Video prompts and scripts are provided as text; this MVP does not render video files. Saved creations are stored in the browser's local IndexedDB on the current device.
