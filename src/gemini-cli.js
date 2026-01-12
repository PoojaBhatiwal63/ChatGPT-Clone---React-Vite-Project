#!/usr/bin/env node
import readline from 'readline';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('Error: GEMINI_API_KEY environment variable is not set.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
  try {
    const url = `https://generativelanguage.googleapis.com/v1/models?key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, { method: 'GET', headers: { Accept: 'application/json' } });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`ListModels failed: ${res.status} ${text}`);
    }
    const body = await res.json();
    return body.models || [];
  } catch (e) {
    return { error: e };
  }
}

function askQuestion(prompt) {
  const rlq = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rlq.question(prompt, (ans) => { rlq.close(); resolve(ans); }));
}

async function chooseModel() {
  const list = await listModels();
  if (list.error) {
    console.warn('Could not list models:', list.error.message || list.error);
    return 'models/text-bison-001';
  }

  if (!Array.isArray(list) || list.length === 0) {
    console.warn('No models returned; using fallback model.');
    return 'models/text-bison-001';
  }

  const candidates = list.slice(0, 20);
  console.log('\nAvailable models:\n');
  candidates.forEach((m, i) => {
    const name = m.name || m.model || m.id || String(m);
    const desc = m.displayName || m.description || '';
    console.log(`${i + 1}. ${name} ${desc ? '- ' + desc : ''}`);
  });

  const defaultIdx = candidates.findIndex((m) => (m.name || m.model || '').includes('bison'));
  const defaultChoice = defaultIdx >= 0 ? defaultIdx + 1 : 1;
  const answer = await askQuestion(`\nChoose a model [1-${candidates.length}] (default ${defaultChoice}): `);
  const idx = parseInt(answer, 10);
  const choice = (!isNaN(idx) && idx >= 1 && idx <= candidates.length) ? candidates[idx - 1] : candidates[defaultChoice - 1];
  return choice.name || choice.model || choice.id || String(choice);
}

const modelName = await chooseModel();
const model = genAI.getGenerativeModel({ model: modelName });

const chat = model.startChat({
  history: [
    {
      role: 'user',
      parts: [{ text: 'You are a helpful and concise AI assistant.' }],
    },
    {
      role: 'model',
      parts: [{ text: 'Understood. How can I help you today?' }],
    },
  ],
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'You: ',
});

console.log('\n--- Gemini Chatbot (Type "exit" to quit) ---');
rl.prompt();

rl.on('line', async (line) => {
  const input = line.trim();

  if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
    console.log('Assistant: Goodbye!');
    rl.close();
    return;
  }

  if (!input) {
    rl.prompt();
    return;
  }

  try {
    const result = await chat.sendMessage(input);
    const response = await result.response;
    const text = response.text();

    console.log(`Assistant: ${text}\n`);
  } catch (err) {
    console.error('Assistant: Sorry, I encountered an error:', err?.message || err);
  }

  rl.prompt();
}).on('close', () => {
  process.exit(0);
});
