import test from 'node:test';
import assert from 'node:assert/strict';

process.env.MONGODB_URI = 'mongodb://127.0.0.1/test';
process.env.JWT_SECRET = 'test';
process.env.AI_PROVIDER = 'gemini';
process.env.AI_API_KEY = 'test-gemini-key';
process.env.AI_MODEL = 'gemini-2.5-flash';

const { generateText } = await import('../services/ai/client.js');

test('Gemini provider sends system instruction and extracts generated text', async () => {
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return {
      status: 200,
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: '{"answer":"ready"}' }] } }] }),
    };
  };

  const text = await generateText({ system: 'Return JSON.', user: 'Test prompt.', maxTokens: 256 });

  assert.equal(text, '{"answer":"ready"}');
  assert.equal(request.url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent');
  assert.equal(request.options.headers['x-goog-api-key'], 'test-gemini-key');
  assert.deepEqual(JSON.parse(request.options.body), {
    systemInstruction: { parts: [{ text: 'Return JSON.' }] },
    contents: [{ role: 'user', parts: [{ text: 'Test prompt.' }] }],
    generationConfig: { maxOutputTokens: 256, responseMimeType: 'application/json' },
  });
});
