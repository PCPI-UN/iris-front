'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface StudentDashboardErrorProps {
  onRetry?: () => void;
  isRetrying?: boolean;
}

/** Estado de error de las vistas del dashboard: evita dejar el spinner indefinidamente. */
export const StudentDashboardError = ({
  onRetry,
  isRetrying = false,
}: StudentDashboardErrorProps) => (
  <div
    role="alert"
    className="rounded-2xl border border-rose-500/30 bg-[#0e101a]/85 p-8 text-center backdrop-blur-xl space-y-3"
  >
    <AlertCircle className="mx-auto size-10 text-rose-400" />
    <h3 className="text-base font-bold text-white">
      No pudimos cargar tu dashboard
    </h3>
    <p className="mx-auto max-w-md text-sm text-slate-400">
      Ocurrió un problema al consultar tu información. Inténtalo de nuevo en
      unos momentos.
    </p>
    {onRetry && (
      <Button
        size="sm"
        variant="flat"
        onPress={onRetry}
        isLoading={isRetrying}
        className="rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-4 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/25"
      >
        Reintentar
      </Button>
    )}
  </div>
);
