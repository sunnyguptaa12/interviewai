import test from 'node:test';
import assert from 'node:assert/strict';

process.env.MONGODB_URI = 'mongodb://127.0.0.1/test';
process.env.JWT_SECRET = 'test';
process.env.AI_PROVIDER = 'anthropic';
process.env.AI_API_KEY = 'key';
process.env.AI_MODEL = 'model';

const { evaluationSchema, resumeAnalysisSchema, questionBatchSchema, domainDetectionSchema } = await import('../services/ai/schemas.js');
const { runStructured } = await import('../services/ai/client.js');
const { buildCategoryPlan } = await import('../services/questionService.js');

const reply = (text, status = 200) => async () => ({ status, ok: status < 400, json: async () => ({ content: [{ type: 'text', text }] }) });

test('evaluation schema clamps out-of-range scores and fills defaults', () => {
  const r = evaluationSchema.parse({ score: 15, relevance: '7', clarity: -2, strengths: null });
  assert.equal(r.score, 10); assert.equal(r.relevance, 7); assert.equal(r.clarity, 0);
  assert.deepEqual(r.strengths, []); assert.equal(r.betterAnswer, '');
});

test('analysis schema requires a domain', () => {
  assert.throws(() => resumeAnalysisSchema.parse({ skills: ['x'] }));
  assert.equal(resumeAnalysisSchema.parse({ domain: 'Finance' }).projects.length, 0);
});

test('question batch normalizes difficulty and tolerates bad values', () => {
  const r = questionBatchSchema.parse({ categories: [{ name: 'SQL', questions: [{ question: 'q', difficulty: 'HARD' }, { question: 'q2', difficulty: 'impossible' }] }] });
  assert.deepEqual(r.categories[0].questions.map((q) => q.difficulty), ['hard', 'medium']);
});

test('domain detection confidence defaults and clamps', () => {
  assert.equal(domainDetectionSchema.parse({ domain: 'HR', confidence: 4 }).confidence, 1);
});

test('category plan adapts to domain and de-duplicates', () => {
  const plan = buildCategoryPlan({ domainAreas: ['SEO', 'Analytics'], technicalSkills: ['seo', 'Google Ads'] }, { missingSkills: ['HubSpot'] });
  const names = plan.map((p) => p.name);
  assert.deepEqual(names.slice(0, 2), ['HR', 'SEO']);
  assert.ok(names.includes('Google Ads') && names.includes('HubSpot') && names.includes('Behavioral'));
  assert.equal(names.filter((n) => n.toLowerCase() === 'seo').length, 1);
  assert.ok(!names.includes('JavaScript')); // no hard-coded software categories
});

test('runStructured returns validated data and strips code fences', async () => {
  globalThis.fetch = reply('```json\n{"score":8,"strengths":["clear"]}\n```');
  const r = await runStructured({ system: 's', user: 'u', schema: evaluationSchema });
  assert.equal(r.score, 8);
});

test('runStructured retries once on invalid JSON then fails safely', async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; return reply('not json')(); };
  await assert.rejects(() => runStructured({ system: 's', user: 'u', schema: evaluationSchema }), /invalid response/);
  assert.equal(calls, 2);
});

test('runStructured recovers after a bad first reply', async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; return reply(calls === 1 ? 'oops' : '{"score":5}')(); };
  assert.equal((await runStructured({ system: 's', user: 'u', schema: evaluationSchema })).score, 5);
});

test('provider rejection surfaces as 502 without retry', async () => {
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; return { status: 400, ok: false, json: async () => ({}) }; };
  await assert.rejects(() => runStructured({ system: 's', user: 'u', schema: evaluationSchema }), (e) => e.statusCode === 502);
  assert.equal(calls, 1);
});
