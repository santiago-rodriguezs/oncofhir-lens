'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Error de aplicación:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Algo salió mal</h1>
      <p className="text-lg text-gray-600 mb-8">
        {error.message || 'Ocurrió un error inesperado'}
      </p>
      <div className="flex space-x-4">
        <button
          onClick={() => reset()}
          className="btn-primary"
        >
          Intentar de nuevo
        </button>
        <Link href="/" className="btn-secondary">
          Volver al Inicio
        </Link>
      </div>
    </div>
  );
}
