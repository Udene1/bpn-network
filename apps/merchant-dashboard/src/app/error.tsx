'use client';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Next.js Error caught:', error);
  }, [error]);

  return (
    <div style={{ padding: '2rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', margin: '2rem' }}>
      <h2 style={{ marginBottom: '1rem' }}>Something went wrong!</h2>
      <pre style={{ background: '#fff', padding: '1rem', overflow: 'auto', borderRadius: '4px' }}>
        {error.message}
        {error.stack}
      </pre>
      <button
        onClick={() => reset()}
        style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#991b1b', color: '#white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        Try again
      </button>
    </div>
  );
}
