// Extracts the first JSON object from model output (handles code fences / stray prose).
export function extractJson(text) {
  const cleaned = String(text).replace(/```json|```/gi, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('No JSON object found');
  return JSON.parse(cleaned.slice(start, end + 1));
}

export const parseStructured = (text, schema) => schema.parse(extractJson(text));
