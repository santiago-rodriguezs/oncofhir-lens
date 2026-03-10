'use client';

import React from 'react';

interface GeneticLoaderProps {
  message?: string;
  submessage?: string;
}

const PAIRS = 8;
const CYCLE = 2.4; // seconds per full rotation

export function GeneticLoader({ message = 'Processing', submessage }: GeneticLoaderProps) {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        {/* DNA Helix */}
        <div className="relative h-40 w-28 motion-reduce:hidden">
          {Array.from({ length: PAIRS }, (_, i) => {
            const delay = (i / PAIRS) * CYCLE;
            return (
              <div
                key={i}
                className="absolute left-0 right-0 flex items-center"
                style={{ top: `${(i / (PAIRS - 1)) * 100}%` }}
              >
                {/* Left nucleotide */}
                <div
                  className="absolute w-3.5 h-3.5 rounded-full"
                  style={{ animation: `helix-left ${CYCLE}s ease-in-out ${delay}s infinite` }}
                />
                {/* Connecting bar */}
                <div
                  className="absolute left-3 right-3 h-[1.5px] top-1/2 -translate-y-1/2 rounded-full"
                  style={{ animation: `helix-bar ${CYCLE}s ease-in-out ${delay}s infinite` }}
                />
                {/* Right nucleotide */}
                <div
                  className="absolute right-0 w-3.5 h-3.5 rounded-full"
                  style={{ animation: `helix-right ${CYCLE}s ease-in-out ${delay}s infinite` }}
                />
              </div>
            );
          })}
        </div>

        {/* Reduced motion fallback */}
        <div className="hidden motion-reduce:block">
          <div className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        </div>

        {/* Text */}
        <div className="text-center space-y-1.5">
          <h3 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {message}
          </h3>
          {submessage && (
            <p className="text-sm text-muted-foreground">{submessage}</p>
          )}
          {/* Loading dots */}
          <div className="flex items-center justify-center gap-1.5 pt-1 motion-reduce:hidden">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-blue-500/60 animate-bounce"
                style={{
                  animationDelay: `${i * 150}ms`,
                  animationDuration: '1.2s',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes helix-left {
          0%, 100% {
            transform: translateX(0);
            background: #3b82f6;
            box-shadow: 0 0 8px #3b82f680;
            opacity: 1;
            scale: 1;
          }
          50% {
            transform: translateX(calc(7rem - 0.875rem));
            background: #8b5cf6;
            box-shadow: 0 0 4px #8b5cf640;
            opacity: 0.35;
            scale: 0.7;
          }
        }
        @keyframes helix-right {
          0%, 100% {
            transform: translateX(0);
            background: #8b5cf6;
            box-shadow: 0 0 4px #8b5cf640;
            opacity: 0.35;
            scale: 0.7;
          }
          50% {
            transform: translateX(calc(-7rem + 0.875rem));
            background: #3b82f6;
            box-shadow: 0 0 8px #3b82f680;
            opacity: 1;
            scale: 1;
          }
        }
        @keyframes helix-bar {
          0%, 100% {
            background: linear-gradient(to right, #3b82f6, #8b5cf6);
            opacity: 0.5;
          }
          25%, 75% {
            opacity: 0.1;
          }
          50% {
            background: linear-gradient(to left, #3b82f6, #8b5cf6);
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}

export default GeneticLoader;
