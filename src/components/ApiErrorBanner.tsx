'use client';

import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ApiErrorBannerProps {
  error: string;
  onDismiss?: () => void;
}

/** Try to extract a friendly message from raw API error JSON */
function parseError(raw: string): { title: string; detail?: string } {
  try {
    const parsed = JSON.parse(raw);
    // Anthropic error shape: { error: "...", ... } or { error: { type, message } }
    const inner = parsed?.error;

    if (typeof inner === 'string') {
      return { title: inner };
    }

    if (inner?.type === 'rate_limit_error') {
      return {
        title: 'Límite de uso alcanzado',
        detail: 'Se excedió el rate limit de la API de Anthropic. Esperá un minuto e intentá de nuevo.',
      };
    }

    if (inner?.type === 'authentication_error') {
      return {
        title: 'Error de autenticación',
        detail: 'La API key de Anthropic no es válida o no está configurada.',
      };
    }

    if (inner?.type === 'not_found_error') {
      return {
        title: 'Modelo no encontrado',
        detail: `El modelo "${inner.message?.match(/model: ([\w.-]+)/)?.[1] || 'solicitado'}" no existe. Verificá la configuración.`,
      };
    }

    if (inner?.message) {
      return { title: inner.message };
    }

    return { title: parsed?.message || raw };
  } catch {
    // Not JSON — check common patterns
    if (raw.includes('Connection error') || raw.includes('ETIMEDOUT')) {
      return {
        title: 'Error de conexión',
        detail: 'No se pudo conectar con la API de Anthropic. Verificá tu conexión a internet.',
      };
    }
    if (raw.includes('truncada') || raw.includes('Unterminated string')) {
      return {
        title: 'Respuesta truncada',
        detail: 'La respuesta de Claude fue demasiado larga y se cortó. Intentá con menos variantes o usá un modelo con mayor capacidad.',
      };
    }
    return { title: raw };
  }
}

export function ApiErrorBanner({ error, onDismiss }: ApiErrorBannerProps) {
  const [showRaw, setShowRaw] = useState(false);
  const { title, detail } = parseError(error);

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-red-100 dark:bg-red-900/50 p-1.5 shrink-0">
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-red-800 dark:text-red-300 text-sm">{title}</p>
          {detail && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{detail}</p>
          )}
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="mt-2 flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
          >
            {showRaw ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {showRaw ? 'Ocultar detalle técnico' : 'Ver detalle técnico'}
          </button>
          {showRaw && (
            <pre className="mt-2 text-xs bg-red-100 dark:bg-red-950/40 rounded p-2 overflow-x-auto text-red-700 dark:text-red-400 whitespace-pre-wrap break-all">
              {error}
            </pre>
          )}
        </div>
        {onDismiss && (
          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={onDismiss}>
            <X className="h-3.5 w-3.5 text-red-500" />
          </Button>
        )}
      </div>
    </div>
  );
}
