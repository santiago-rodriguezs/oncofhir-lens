'use client';

import { BeakerIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { DetectedIssue } from '@/types/fhir';

interface TherapyCardsProps {
  issues: DetectedIssue[];
}

export default function TherapyCards({ issues }: TherapyCardsProps) {
  if (!issues || issues.length === 0) {
    return null;
  }
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Sugerencias Terapéuticas</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {issues.map((issue, index) => (
          <div 
            key={index} 
            className="card border-l-4 border-primary-500 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <BeakerIcon className="h-6 w-6 text-primary-500" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">{issue.detail}</h3>
                <div className="mt-2 text-sm text-gray-600">
                  <p>{issue.evidence}</p>
                </div>
                
                {issue.mitigation && issue.mitigation.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700">Terapias Sugeridas:</h4>
                    <ul className="mt-1 space-y-1">
                      {issue.mitigation.map((therapy, idx) => (
                        <li key={idx} className="flex items-start">
                          <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                          <span className="text-sm">{therapy}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {issue.evidenceUrls && issue.evidenceUrls.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700">Evidencia:</h4>
                    <ul className="mt-1 space-y-1">
                      {issue.evidenceUrls.map((url, idx) => (
                        <li key={idx}>
                          <a 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-primary-600 hover:text-primary-800"
                          >
                            {url.replace(/^https?:\/\//, '').split('/')[0]}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {issue.severity === 'high' && (
                  <div className="mt-4 flex items-center text-amber-600">
                    <ExclamationTriangleIcon className="h-5 w-5 mr-1" />
                    <span className="text-sm font-medium">Alta prioridad</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
