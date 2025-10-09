'use client';

import React from 'react';

interface GeneticLoaderProps {
  message?: string;
  submessage?: string;
}

export function GeneticLoader({ message = 'Processing', submessage }: GeneticLoaderProps) {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-8">
        {/* DNA Helix Animation */}
        <div className="relative w-32 h-32">
          {/* DNA Strands */}
          <div className="absolute inset-0 animate-[spin_8s_linear_infinite]">
            {/* Left strand */}
            <div className="absolute left-0 top-0 w-16 h-full flex flex-col justify-around">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div
                  key={`left-${i}`}
                  className="w-4 h-4 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50 animate-pulse"
                  style={{
                    animationDelay: `${i * 250}ms`,
                    animationDuration: '2s',
                  }}
                />
              ))}
            </div>
            {/* Right strand */}
            <div className="absolute right-0 top-0 w-16 h-full flex flex-col justify-around">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div
                  key={`right-${i}`}
                  className="w-4 h-4 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50 ml-auto animate-pulse"
                  style={{
                    animationDelay: `${i * 250 + 125}ms`,
                    animationDuration: '2s',
                  }}
                />
              ))}
            </div>
            {/* Connecting lines */}
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div
                key={`line-${i}`}
                className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 animate-pulse"
                style={{
                  top: `${(i + 0.5) * 12.5}%`,
                  opacity: 0.6,
                  animationDelay: `${i * 250}ms`,
                  animationDuration: '2s',
                }}
              />
            ))}
          </div>
          
          {/* Center glow effect */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl animate-pulse" />
          </div>
        </div>

        {/* Text */}
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {message}
          </h3>
          {submessage && (
            <p className="text-sm text-gray-600 animate-pulse">
              {submessage}
            </p>
          )}
          
          {/* Loading dots */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-bounce"
                style={{
                  animationDelay: `${i * 160}ms`,
                  animationDuration: '1.4s',
                }}
              />
            ))}
          </div>
        </div>

        {/* Floating molecules */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
            <div
              key={`molecule-${i}`}
              className="absolute w-3 h-3 rounded-full animate-[float_5s_ease-in-out_infinite]"
              style={{
                left: `${(i * 8.33) % 100}%`,
                top: `${(i * 13.7) % 100}%`,
                background: i % 2 === 0 
                  ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' 
                  : 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                animationDelay: `${(i * 0.5) % 2}s`,
                animationDuration: `${3 + (i % 4)}s`,
                opacity: 0.3,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default GeneticLoader;
