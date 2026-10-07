export const cleanText = (t = '') =>
  t.replace(/\r/g, '\n').replace(/\u0000/g, '').replace(/[ \t\u00a0]+/g, ' ')
    .replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();

// Strip contact details before text is sent to the AI provider.
export const redactPII = (t = '') =>
  t.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email]')
    .replace(/\+?\d[\d\s().-]{8,}\d/g, (m) => (m.replace(/\D/g, '').length >= 10 ? '[phone]' : m))
    .replace(/https?:\/\/\S+/g, '[link]');

export const truncate = (t = '', max = 12000) => (t.length > max ? t.slice(0, max) : t);
export const prepareForAI = (t) => truncate(redactPII(t));
export const normalizeQuestion = (q = '') => q.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
