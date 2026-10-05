import { createVerify } from 'node:crypto';
import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

export const creatorServerRouter = Router();

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'oneag-b9739';
const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-3.8-flash';
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image';
const VALID_WORKFLOWS = new Set([
  'auto', 'image', 'thumbnail', 'image-prompt', 'video-prompt', 'seo',
  'ideas', 'story', 'script', 'shorts', 'daily-pack'
]);

type FirebaseClaims = { aud?: string; iss?: string; sub?: string; exp?: number; iat?: number; auth_time?: number };
let signingCerts: { expiresAt: number; certs: Record<string, string> } | null = null;
const requestsByUser = new Map<string, number[]>();

async function getSigningCerts(): Promise<Record<string, string>> {
  if (signingCerts && signingCerts.expiresAt > Date.now()) return signingCerts.certs;
  const response = await fetch('https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com');
  if (!response.ok) throw new Error('Firebase token verification is temporarily unavailable.');
  const certs = await response.json() as Record<string, string>;
  const maxAge = Number(response.headers.get('cache-control')?.match(/max-age=(\d+)/)?.[1] || 300);
  signingCerts = { certs, expiresAt: Date.now() + Math.min(maxAge, 3600) * 1000 };
  return certs;
}

async function verifyFirebaseToken(token: string): Promise<string | null> {
  try {
    const [encodedHeader, encodedClaims, signature] = token.split('.');
    if (!encodedHeader || !encodedClaims || !signature) return null;
    const header = JSON.parse(Buffer.from(encodedHeader, 'base64url').toString()) as { alg?: string; kid?: string };
    const claims = JSON.parse(Buffer.from(encodedClaims, 'base64url').toString()) as FirebaseClaims;
    if (header.alg !== 'RS256' || !header.kid) return null;
    if (claims.aud !== FIREBASE_PROJECT_ID || claims.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`) return null;
    const now = Math.floor(Date.now() / 1000);
    if (!claims.sub || claims.sub.length > 128 || !claims.exp || claims.exp <= now || !claims.iat || claims.iat > now + 60) return null;
    if (claims.auth_time && claims.auth_time > now + 60) return null;
    const cert = (await getSigningCerts())[header.kid];
    if (!cert) return null;
    const verifier = createVerify('RSA-SHA256');
    verifier.update(`${encodedHeader}.${encodedClaims}`);
    verifier.end();
    return verifier.verify(cert, Buffer.from(signature, 'base64url')) ? claims.sub : null;
  } catch {
    return null;
  }
}

async function requireFirebaseUser(req: Request, res: Response, next: () => void) {
  const authorization = req.header('authorization') || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    res.status(401).json({ error: 'Sign in to use AG Creator.' });
    return;
  }
  const uid = await verifyFirebaseToken(match[1]);
  if (!uid) {
    res.status(401).json({ error: 'Your sign-in session could not be verified. Please sign in again.' });
    return;
  }
  (req as Request & { creatorUid?: string }).creatorUid = uid;
  next();
}

creatorServerRouter.get('/status', (_req: Request, res: Response) => {
  res.json({ configured: Boolean(process.env.GEMINI_API_KEY), provider: 'Gemini' });
});

function requireGeminiConfiguration(_req: Request, res: Response, next: () => void) {
  if (!process.env.GEMINI_API_KEY) {
    res.status(503).json({ error: 'AI generation is not configured yet. Add GEMINI_API_KEY to the server environment to enable it.' });
    return;
  }
  next();
}

function inferWorkflow(input: string): string {
  const text = input.toLowerCase();
  if (/thumbnail|youtube cover/.test(text)) return 'thumbnail';
  if (/image|poster|artwork|illustration|picture/.test(text)) return 'image';
  if (/seo|hashtag|keyword|title and description/.test(text)) return 'seo';
  if (/reel|shorts|tiktok|instagram short/.test(text)) return 'shorts';
  if (/video prompt|text.to.video|video generation/.test(text)) return 'video-prompt';
  if (/script|youtube video|voiceover/.test(text)) return 'script';
  if (/story|fiction|character/.test(text)) return 'story';
  if (/idea|trend|trending/.test(text)) return 'ideas';
  return 'script';
}

function promptFor(workflow: string, input: string): string {
  const instructions: Record<string, string> = {
    'image-prompt': 'Create one polished, specific image-generation prompt. Include subject, composition, lighting, palette, art direction, camera or rendering detail, and a concise negative prompt. Return the prompt and negative prompt.',
    'video-prompt': 'Write a production-ready text-to-video prompt with subject, action, setting, camera movement, shot progression, lighting, mood, timing, and aspect ratio. Do not claim a video file was rendered.',
    seo: 'Create creator-ready SEO metadata. Include 5 clickable title options, a description, primary and secondary keywords, hashtags, and platform tags. Avoid keyword stuffing.',
    ideas: 'Create 8 original creator ideas related to the request. For each give a hook, suggested format, and why an audience might care. These are AI suggestions, not verified live trend data.',
    story: 'Write an engaging short story based on the request. Include a strong opening, vivid scenes, and satisfying ending. Keep the voice natural and label the title.',
    script: 'Write a ready-to-record video script with a strong opening hook, spoken narration, scene or B-roll cues, a clear payoff, and a natural call to action.',
    shorts: 'Create a short-form Reels/Shorts script of about 30-45 seconds with an immediate hook, concise beats, on-screen text suggestions, visual cues, and a closing call to action.',
    'daily-pack': 'Create today’s creator pack as Markdown with: one timely-feeling but evergreen content idea, one 30-second short script, one image-generation prompt, one SEO title, 5 hashtags, and one creator action for today. Do not state unverified current events or claim live trend research.',
  };
  return `You are AG Creator, a practical creative partner. Understand the user’s intent and deliver useful, specific work. Be clear about uncertainty and do not claim actions or media that were not produced.\n\nWorkflow: ${workflow}\nUser idea: ${input}\n\nTask: ${instructions[workflow] || instructions.script}`;
}

creatorServerRouter.post('/generate', requireGeminiConfiguration, requireFirebaseUser, async (req: Request, res: Response) => {
  const uid = (req as Request & { creatorUid?: string }).creatorUid!;
  const input = typeof req.body?.input === 'string' ? req.body.input.trim() : '';
  let workflow = typeof req.body?.workflow === 'string' ? req.body.workflow : 'auto';
  if (!input || input.length > 2000) {
    res.status(400).json({ error: 'Add an idea under 2,000 characters to get started.' });
    return;
  }
  if (!VALID_WORKFLOWS.has(workflow)) {
    res.status(400).json({ error: 'Choose one of the available creator workflows.' });
    return;
  }
  if (workflow === 'auto') workflow = inferWorkflow(input);

  const recent = (requestsByUser.get(uid) || []).filter((timestamp) => Date.now() - timestamp < 60_000);
  if (recent.length >= 8) {
    res.status(429).json({ error: 'You have reached the short-term generation limit. Please try again in a minute.' });
    return;
  }
  recent.push(Date.now());
  requestsByUser.set(uid, recent);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: 'AI generation is not configured yet. Add GEMINI_API_KEY to the server environment to enable it.' });
    return;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    if (workflow === 'image' || workflow === 'thumbnail') {
      const imagePrompt = `Create a polished ${workflow === 'thumbnail' ? 'YouTube thumbnail, 16:9 composition with one clear focal subject and open space for title text' : 'creator image'} for this idea. Do not render legible words in the image. Idea: ${input}`;
      const response = await ai.models.generateContent({
        model: IMAGE_MODEL,
        contents: imagePrompt,
        config: {
          responseModalities: ['IMAGE'],
          ...(workflow === 'thumbnail' ? { imageConfig: { aspectRatio: '16:9' } } : {}),
        },
      });
      const parts = response.candidates?.[0]?.content?.parts || [];
      const generatedImage = parts.find((part) => part.inlineData?.data);
      if (!generatedImage?.inlineData?.data) throw new Error('The image model returned no image. Try a more specific description.');
      res.json({ workflow, image: generatedImage.inlineData.data, mimeType: generatedImage.inlineData.mimeType || 'image/png', text: `Image prompt: ${imagePrompt}` });
      return;
    }

    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: promptFor(workflow, input),
    });
    const text = response.text?.trim();
    if (!text) throw new Error('The AI provider returned an empty result. Please try again.');
    res.json({ workflow, text });
  } catch (error) {
    console.error('AG Creator generation failed:', error);
    const providerStatus = typeof error === 'object' && error !== null && 'status' in error
      ? Number((error as { status?: unknown }).status)
      : 0;
    const providerMessage = error instanceof Error ? error.message : String(error);
    const imageWorkflow = workflow === 'image' || workflow === 'thumbnail';
    const imageQuotaUnavailable = imageWorkflow && providerStatus === 429 && /limit:\s*0|free.?tier.*quota|Quota exceeded/i.test(providerMessage);
    if (imageQuotaUnavailable) {
      res.status(503).json({
        error: `Gemini image generation is unavailable because this project has no Free Tier quota for ${IMAGE_MODEL}. Text workflows are still available.`,
      });
      return;
    }
    if (providerStatus === 503 && /high demand|unavailable|temporar/i.test(providerMessage)) {
      res.status(503).json({ error: 'AI service is temporarily busy. Please try again in a few minutes.' });
      return;
    }
    res.status(502).json({ error: 'Generation failed at the AI provider. Check the server logs and try again.' });
  }
});
