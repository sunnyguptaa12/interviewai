import api from '../services/api';

export async function fetchBlob(path) {
  const { data } = await api.get(path, { responseType: 'blob' });
  return data;
}
export async function downloadFile(path, filename) {
  const url = URL.createObjectURL(await fetchBlob(path));
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
