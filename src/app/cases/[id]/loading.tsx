import LoadingSpinner from '@/components/LoadingSpinner';

export default function CaseDetailLoading() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse mb-2"></div>
          <div className="h-5 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
      </div>
      
      <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
      
      <div className="card">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse mb-6"></div>
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="large" message="Cargando datos de variantes..." />
        </div>
      </div>
    </div>
  );
}
