import { useCallback, useEffect, useState } from 'react';

export const useAsync = <T>(fn: () => Promise<T>, immediate = true) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      setData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [fn]);

  useEffect(() => {
    if (!immediate) return;
    void execute();
  }, [execute, immediate]);

  return { data, loading, error, execute, setData };
};
