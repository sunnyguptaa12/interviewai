import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

process.env.MONGODB_URI = 'mongodb://127.0.0.1/test';
process.env.JWT_SECRET = 'test';
const { extractText } = await import('../services/resume/extractor.js');

const tmp = async (name, content) => { const p = path.join(await fs.mkdtemp(path.join(os.tmpdir(), 'cv-')), name); await fs.writeFile(p, content); return p; };

test('rejects a file whose content does not match its extension', async () => {
  const p = await tmp('fake.pdf', 'this is plain text, not a pdf');
  await assert.rejects(() => extractText(p), (e) => e.statusCode === 400);
});

test('rejects a corrupted docx that has a zip signature', async () => {
  const p = await tmp('bad.docx', Buffer.from('PK\u0003\u0004garbage'));
  await assert.rejects(() => extractText(p), (e) => e.statusCode === 422);
});
