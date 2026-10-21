import { useEffect, useRef } from 'react';
import { useHospital } from '../state/context';

export function Alert({ error, success }) {
  const { notify } = useHospital();
  const last = useRef({ error: '', success: '' });

  useEffect(() => {
    if (error && error !== last.current.error) notify('error', error);
    if (success && success !== last.current.success) notify('success', success);
    last.current = { error, success };
  }, [error, success, notify]);

  return null;
}
