'use client';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
}

export default function LoadingSpinner({ size = 'medium', message }: LoadingSpinnerProps) {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12',
  };
  
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full border-t-2 border-b-2 border-primary-600" 
        aria-hidden="true"
        role="status"
        aria-label="Loading"
        data-testid="loading-spinner"
        style={{ borderTopColor: 'currentColor' }}
        className={`${sizeClasses[size]}`}
      />
      {message && (
        <p className="mt-2 text-sm text-gray-600">{message}</p>
      )}
    </div>
  );
}
