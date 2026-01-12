import {
  GoogleGenerativeAI,
} from "@google/generative-ai";

const nodeApiKey = (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) || null;
const viteApiKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) || null;
const api = nodeApiKey || viteApiKey || null;

let genAI = null;
let model = null;
const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

if (api) {
  genAI = new GoogleGenerativeAI(api);
  model = genAI.getGenerativeModel({ model: "models/text-bison-001" });
}

let cached = { model: null, modelName: null };

async function listModels() {
  try {
    const url = `https://generativelanguage.googleapis.com/v1/models?key=${encodeURIComponent(api)}`;
    const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
    if (!res.ok) {
      throw new Error(`ListModels HTTP ${res.status}`);
    }
    const body = await res.json();
    return body.models || [];
  } catch (e) {
    return null;
  }
}

async function initModel() {
  if (!api) throw new Error('GEMINI_API_KEY is not available. Set GEMINI_API_KEY (Node) or VITE_GEMINI_API_KEY (Vite) before calling `run()`.');
  if (cached.model) return cached;

  // Try listing models from the API to pick a compatible one
  let chosen = null;
  const models = await listModels();
  if (models && models.length) {
    // Prefer chat-like models, then bison, then gemini
    const names = models.map((m) => m.name || m.model || m.id || '');
    chosen = names.find((n) => /chat/i.test(n)) || names.find((n) => /bison/i.test(n)) || names.find((n) => /gemini/i.test(n)) || names[0];
  }

  const fallbacks = ['models/chat-bison-001', 'models/text-bison-001'];
  const candidates = (chosen ? [chosen, ...fallbacks] : fallbacks).filter(Boolean);

  for (const cand of candidates) {
    try {
      const m = genAI.getGenerativeModel({ model: cand });
      // verify startChat exists
      if (typeof m.startChat === 'function') {
        cached = { model: m, modelName: cand };
        return cached;
      }
    } catch (e) {
      // ignore and try next
    }
  }

  throw new Error('No compatible generative model found. Call ListModels to inspect available models.');
}

async function run(prompt) {
  await initModel();
  const m = cached.model;
  if (!m) throw new Error('No initialized model available');

  const chatSession = m.startChat({ generationConfig, history: [] });
  const result = await chatSession.sendMessage(prompt);
  // Many SDK responses expose result.response.text()
  if (result && result.response && typeof result.response.text === 'function') {
    return result.response.text();
  }

  return JSON.stringify(result);
}

export default run;