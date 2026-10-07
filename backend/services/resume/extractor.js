import fs from 'fs/promises';
import path from 'path';
import mammoth from 'mammoth';
import { ApiError } from '../../utils/ApiError.js';
import { cleanText } from '../../utils/text.js';

// Verify real file signature, not just the extension/MIME the client claimed.
async function verifySignature(filePath, ext) {
  const buf = Buffer.alloc(4);
  const fh = await fs.open(filePath, 'r');
  try { await fh.read(buf, 0, 4, 0); } finally { await fh.close(); }
  const ok = ext === '.pdf' ? buf.toString('latin1', 0, 4) === '%PDF' : buf[0] === 0x50 && buf[1] === 0x4b;
  if (!ok) throw new ApiError(400, 'File content does not match its extension');
}

async function pdfToText(filePath) {
  // Loaded lazily: pdfjs prints canvas polyfill warnings we don't need at startup.
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await fs.readFile(filePath)), useSystemFonts: true, isEvalSupported: false }).promise;
  const pages = [];
  for (let i = 1; i <= Math.min(doc.numPages, 15); i += 1) { // resumes are short; cap pages
    const content = await (await doc.getPage(i)).getTextContent();
    pages.push(content.items.map((it) => it.str + (it.hasEOL ? '\n' : ' ')).join(''));
  }
  await doc.destroy();
  return pages.join('\n\n');
}

export async function extractText(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  await verifySignature(filePath, ext);
  let raw = '';
  try {
    if (ext === '.pdf') raw = await pdfToText(filePath);
    else raw = (await mammoth.extractRawText({ path: filePath })).value;
  } catch {
    throw new ApiError(422, 'Could not read this file. It may be corrupted or password protected.');
  }
  const text = cleanText(raw);
  if (text.length < 50) throw new ApiError(422, 'No readable text found. Scanned/image-only resumes are not supported yet.');
  return text;
}
