'use client';

import { OncoKbAnnotation } from '@/lib/oncokb/client';
import { OncoKbSuggestedDrug, getOncoKbSummaryStats } from '@/lib/oncokb/hooks';
import { 
  BeakerIcon, 
  ChartBarIcon, 
  FireIcon, 
  ShieldCheckIcon 
} from '@heroicons/react/24/outline';

interface OncoKbSummaryCardsProps {
  results: OncoKbAnnotation[];
  drugs: OncoKbSuggestedDrug[];
}

export default function OncoKbSummaryCards({ results, drugs }: OncoKbSummaryCardsProps) {
  // Get summary statistics
  const stats = getOncoKbSummaryStats(results);
  
  // Format level for display
  const formatLevel = (level: string | null) => {
    if (!level) return 'N/A';
    return level;
  };
  
  // Calculate hotspot percentage
  const hotspotPercentage = stats.totalVariants > 0
    ? Math.round((stats.hotspotCount / stats.totalVariants) * 100)
    : 0;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Variants card */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center">
          <div className="p-2 rounded-full bg-blue-100 mr-3">
            <ChartBarIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Variantes Anotadas</p>
            <p className="text-xl font-semibold">
              {stats.annotatedVariants} / {stats.totalVariants}
            </p>
          </div>
        </div>
      </div>
      
      {/* Drugs card */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center">
          <div className="p-2 rounded-full bg-green-100 mr-3">
            <BeakerIcon className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Drogas Únicas</p>
            <p className="text-xl font-semibold">{drugs.length}</p>
          </div>
        </div>
      </div>
      
      {/* Best level card */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center">
          <div className="p-2 rounded-full bg-purple-100 mr-3">
            <ShieldCheckIcon className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Mejor Nivel</p>
            <p className="text-xl font-semibold">
              {stats.bestLevel ? (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  stats.bestLevel === '1' ? 'bg-green-100 text-green-800' :
                  stats.bestLevel === '2' ? 'bg-blue-100 text-blue-800' :
                  stats.bestLevel === '3' ? 'bg-yellow-100 text-yellow-800' :
                  stats.bestLevel === '4' ? 'bg-orange-100 text-orange-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {formatLevel(stats.bestLevel)}
                </span>
              ) : 'N/A'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Hotspots card */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center">
          <div className="p-2 rounded-full bg-red-100 mr-3">
            <FireIcon className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Hotspots</p>
            <p className="text-xl font-semibold">
              {stats.hotspotCount} ({hotspotPercentage}%)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
