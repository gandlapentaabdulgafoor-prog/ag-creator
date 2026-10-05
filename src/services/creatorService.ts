import { User } from 'firebase/auth';

export type CreatorWorkflow =
  | 'auto' | 'image' | 'thumbnail' | 'image-prompt' | 'video-prompt'
  | 'seo' | 'ideas' | 'story' | 'script' | 'shorts' | 'daily-pack';

export interface CreatorResult {
  id: string;
  workflow: CreatorWorkflow;
  input: string;
  text: string;
  image?: string;
  mimeType?: string;
  createdAt: string;
}

const DATABASE_NAME = 'ag-creator';
const STORE_NAME = 'creations';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open saved creations.'));
  });
}

export async function saveCreation(creation: CreatorResult): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(creation);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('Could not save this creation.'));
  });
  db.close();
}

export async function getCreations(): Promise<CreatorResult[]> {
  const db = await openDatabase();
  const results = await new Promise<CreatorResult[]>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve((request.result as CreatorResult[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    request.onerror = () => reject(request.error || new Error('Could not load saved creations.'));
  });
  db.close();
  return results;
}

export async function deleteCreation(id: string): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('Could not delete this creation.'));
  });
  db.close();
}

export async function generateCreation(user: User, workflow: CreatorWorkflow, input: string): Promise<Omit<CreatorResult, 'id' | 'createdAt' | 'input'>> {
  const token = await user.getIdToken();
  const response = await fetch('/api/creator/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ workflow, input }),
  });
  const payload = await response.json() as { workflow?: CreatorWorkflow; text?: string; image?: string; mimeType?: string; error?: string };
  if (!response.ok) throw new Error(payload.error || 'Creator request failed. Please try again.');
  if (!payload.text) throw new Error('The creator workflow returned no content. Please try again.');
  return { workflow: payload.workflow || workflow, text: payload.text, image: payload.image, mimeType: payload.mimeType };
}
