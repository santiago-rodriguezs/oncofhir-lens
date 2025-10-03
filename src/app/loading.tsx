import LoadingSpinner from '@/components/LoadingSpinner';

export default function Loading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center">
      <LoadingSpinner size="large" message="Cargando..." />
    </div>
  );
}
