'use client';
import { useCallback, useEffect, useState } from 'react';
export function useResource<T>(loader: (signal: AbortSignal) => Promise<T>) {
  const [state, setState] = useState<{
    source: typeof loader;
    data: T | null;
    loading: boolean;
    error: string | null;
  }>({ source: loader, data: null, loading: true, error: null });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    loader(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted)
          setState({ source: loader, data, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setState({
            source: loader,
            data: null,
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : 'No pudimos cargar los datos.',
          });
      });
    return () => controller.abort();
  }, [loader, version]);
  const reload = useCallback(() => {
    setState((previous) => ({
      ...previous,
      data: null,
      loading: true,
      error: null,
    }));
    setVersion((value) => value + 1);
  }, []);
  return state.source === loader
    ? { data: state.data, loading: state.loading, error: state.error, reload }
    : { data: null, loading: true, error: null, reload };
}
