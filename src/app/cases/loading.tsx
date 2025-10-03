import LoadingSpinner from '@/components/LoadingSpinner';

export default function CasesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
      </div>
      
      <div className="card">
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="large" message="Cargando casos..." />
        </div>
      </div>
    </div>
  );
}
