import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { extractJson } from '../../utils/json.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function timedFetch(url, options, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } catch (e) {
    if (e.name === 'AbortError') throw Object.assign(new ApiError(504, 'AI request timed out'), { retryable: true });
    throw Object.assign(new ApiError(502, 'Could not reach the AI provider'), { retryable: true });
  } finally { clearTimeout(timer); }
}

// Each adapter returns { res, extract(json) -> text }. Add a provider here to support it.
const providers = {
  anthropic: async ({ system, user, maxTokens, timeoutMs }) => ({
    res: await timedFetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': env.ai.apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: env.ai.model, max_tokens: maxTokens, system, messages: [{ role: 'user', content: user }] }),
    }, timeoutMs),
    extract: (d) => (d.content || []).filter((b) => b.type === 'text').map((b) => b.text).join(''),
  }),
  openai: async ({ system, user, maxTokens, timeoutMs }) => ({
    res: await timedFetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${env.ai.apiKey}` },
      body: JSON.stringify({ model: env.ai.model, max_tokens: maxTokens, response_format: { type: 'json_object' },
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }] }),
    }, timeoutMs),
    extract: (d) => d.choices?.[0]?.message?.content,
  }),
  gemini: async ({ system, user, maxTokens, timeoutMs }) => ({
    res: await timedFetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.ai.model)}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': env.ai.apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: { maxOutputTokens: maxTokens, responseMimeType: 'application/json' },
      }),
    }, timeoutMs),
    extract: (d) => (d.candidates?.[0]?.content?.parts || []).map((part) => part.text || '').join(''),
  }),
};

async function callOnce(args) {
  const provider = providers[env.ai.provider];
  if (!provider) throw new ApiError(500, `Unsupported AI_PROVIDER: ${env.ai.provider}`);
  const { res, extract } = await provider(args);
  if (res.status === 429) throw Object.assign(new ApiError(429, 'AI service is busy. Please retry shortly.'), { retryable: true });
  if (res.status >= 500) throw Object.assign(new ApiError(502, 'AI provider error'), { retryable: true });
  if (!res.ok) throw new ApiError(502, 'AI request was rejected by the provider');
  const text = extract(await res.json());
  if (!text || !text.trim()) throw Object.assign(new ApiError(502, 'AI returned an empty response'), { retryable: true });
  return text;
}

export async function generateText({ system, user, maxTokens = 4000, timeoutMs = env.ai.timeoutMs }) {
  if (!env.ai.apiKey || !env.ai.model) throw new ApiError(503, 'AI is not configured. Set AI_API_KEY and AI_MODEL on the server.');
  for (let attempt = 0; ; attempt += 1) {
    try { return await callOnce({ system, user, maxTokens, timeoutMs }); }
    catch (e) {
      if (!e.retryable || attempt >= 2) throw e;
      await sleep(800 * 2 ** attempt);
    }
  }
}

// Calls the model, parses JSON and validates it with zod. One corrective retry on bad output.
export async function runStructured({ system, user, schema, maxTokens = 4000, timeoutMs }) {
  for (let i = 0; i < 2; i += 1) {
    const prompt = i === 0 ? user : `${user}\n\nYour previous reply was not valid JSON for the required shape. Reply with ONLY the JSON object.`;
    const text = await generateText({ system, user: prompt, maxTokens, timeoutMs });
    try { return schema.parse(extractJson(text)); } catch { /* retry once */ }
  }
  throw new ApiError(502, 'AI returned an invalid response. Please try again.');
}
