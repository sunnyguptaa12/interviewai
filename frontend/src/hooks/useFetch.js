import { useCallback, useEffect, useState } from 'react';
import api, { getErrorMessage } from '../services/api';

export function useFetch(url, params) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const key = JSON.stringify(params || {});
  const load = useCallback(async () => {
    if (!url) return;
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const { data } = await api.get(url, { params: JSON.parse(key) });
      setState({ data: data.data, loading: false, error: '' });
    } catch (e) { setState({ data: null, loading: false, error: getErrorMessage(e) }); }
  }, [url, key]);
  useEffect(() => { load(); }, [load]);
  return { ...state, reload: load };
}

export function useDebounce(value, delay = 400) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return v;
}
