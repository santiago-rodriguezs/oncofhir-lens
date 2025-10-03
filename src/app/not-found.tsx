import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">404 - Página No Encontrada</h1>
      <p className="text-lg text-gray-600 mb-8">
        La página que estás buscando no existe o ha sido movida.
      </p>
      <Link href="/" className="btn-primary">
        Volver al Inicio
      </Link>
    </div>
  );
}
