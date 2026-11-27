'use client';

import { useCallback, useState } from 'react';
import {
  downloadMyDiploma,
  getDiplomaErrorMessage,
} from '../api/get-student-dashboard';

/**
 * Estado de la descarga del diploma para un botón: `download` baja el PDF y, si falla,
 * deja en `error` el mensaje para el estudiante.
 */
export const useMyDiplomaDownload = (eventId: number | string) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = useCallback(async () => {
    setIsDownloading(true);
    setError(null);
    try {
      await downloadMyDiploma(eventId);
    } catch (err) {
      setError(getDiplomaErrorMessage(err));
    } finally {
      setIsDownloading(false);
    }
  }, [eventId]);

  return { isDownloading, error, download };
};
