'use client';
import { useRef, useState } from 'react';
export function useSave() {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function save(operation: () => Promise<unknown>, done: () => void) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await operation();
      done();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'No fue posible guardar.',
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return { busy, error, save };
}
