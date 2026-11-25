'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  History,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  FolderGit2,
  Download,
  FileText,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AcademicParticipation } from '../types';
import {
  downloadMyDiploma,
  getDiplomaErrorMessage,
} from '../api/get-student-dashboard';
import { formatScoreWithMax } from '../utils/format-score';

export interface StudentHistorySectionProps {
  trajectory: AcademicParticipation[];
}

const DiplomaDownload = ({
  eventId,
  projectName,
}: {
  eventId: string | number;
  projectName: string;
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setIsDownloading(true);
    setError(null);
    try {
      await downloadMyDiploma(eventId);
    } catch (err) {
      setError(getDiplomaErrorMessage(err));
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="pt-3 border-t border-white/10 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Award className="size-3.5 text-pink-400" />
          <span>Diploma de premio del evento</span>
        </span>
        <Button
          size="sm"
          variant="flat"
          isLoading={isDownloading}
          onPress={handleDownload}
          className="inline-flex items-center gap-1.5 rounded-lg border border-pink-500/40 bg-pink-500/20 px-3 py-1.5 text-xs font-semibold text-pink-200 hover:bg-pink-500/30 transition-all shadow-sm"
          title={`Descargar el diploma de ${projectName}`}
        >
          {!isDownloading && <Download className="size-3.5" />}
          <span>Descargar Diploma (PDF)</span>
        </Button>
      </div>
      {error && (
        <p
          role="alert"
          className="flex items-center gap-1.5 text-xs text-red-300"
        >
          <AlertCircle className="size-3.5 shrink-0 text-red-400" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};

export const StudentHistorySection = ({
  trajectory,
}: StudentHistorySectionProps) => {
  const router = useRouter();

  const handleViewProject = (item: AcademicParticipation) => {
    // Sin evento no hay ficha que abrir (el botón no se muestra en ese caso)
    if (item.eventId === undefined || item.eventId === null) return;
    router.push(`/app/events/${item.eventId}/dashboard`);
  };

  if (!trajectory || trajectory.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0e101a]/85 p-8 text-center backdrop-blur-xl space-y-3">
        <History className="mx-auto size-10 text-slate-500" />
        <h3 className="text-base font-bold text-white">
          ¡Bienvenido a tu Historial Académico!
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
          Aún no registras participaciones en semestres anteriores. A medida que presentes tus proyectos en las ferias de la Universidad del Norte, aquí podrás consultar tus logros y descargar tus diplomas oficiales.
        </p>
      </div>
    );
  }

  // Ordenar cronológicamente (más reciente primero)
  const sortedTrajectory = [...trajectory].sort((a, b) => {
    if (a.isCurrent) return -1;
    if (b.isCurrent) return 1;
    return b.semester.localeCompare(a.semester);
  });

  return (
    <div
      className="space-y-6 rounded-2xl border border-white/10 bg-[#0e101a]/85 p-5 backdrop-blur-xl shadow-xl sm:p-7"
      aria-label="Trayectoria e Historial Académico"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <History className="size-4.5 text-cyan-400" />
            <span>Trayectoria e Historial de Participaciones</span>
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Registro cronológico oficial de tus participaciones y reconocimientos en la Universidad del Norte.
          </p>
        </div>
        <span className="font-mono text-xs font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-lg self-start sm:self-auto">
          {trajectory.length} {trajectory.length === 1 ? 'Edición registrada' : 'Ediciones registradas'}
        </span>
      </div>

      {/* Línea de Tiempo Cronológica: Columna Flex Unificada para Centrado Físico 100% Exacto */}
      <div className="space-y-0 py-2">
        {sortedTrajectory.map((item, index) => {
          const isLast = index === sortedTrajectory.length - 1;

          return (
            <div key={item.id} className="flex gap-4 sm:gap-6">
              {/* Columna Vertical de la Línea de Tiempo: Círculo y Conector en el mismo eje X exacto */}
              <div className="flex flex-col items-center">
                {/* Nodo circular sin parpadeo (animate-ping eliminado, centro estático) */}
                <div
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    item.isCurrent
                      ? 'border-cyan-400 bg-cyan-950 shadow-[0_0_10px_rgba(34,211,238,0.45)]'
                      : 'border-slate-600 bg-slate-900'
                  }`}
                  aria-hidden="true"
                >
                  <span
                    className={`size-2 rounded-full ${
                      item.isCurrent ? 'bg-cyan-400' : 'bg-slate-400'
                    }`}
                  />
                </div>

                {/* Conector vertical continuo entre ediciones */}
                {!isLast && (
                  <div
                    className="w-0.5 grow bg-cyan-500/25 my-1.5 min-h-[3rem]"
                    aria-hidden="true"
                  />
                )}
              </div>

              {/* Contenido de la tarjeta semestral con Micro-elevación háptica (Propuesta C) */}
              <div className={`flex-1 ${isLast ? 'pb-2' : 'pb-7'}`}>
                <motion.div
                  whileHover={{ y: -1.5 }}
                  transition={{ duration: 0.15 }}
                  className="rounded-xl border border-white/10 bg-black/35 p-4.5 transition-colors hover:border-cyan-500/30 hover:bg-black/50 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-0.5 rounded-md">
                        <Calendar className="size-3 text-cyan-400" />
                        <span>Semestre {item.semester}</span>
                      </span>
                      {item.isCurrent && (
                        <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                          Edición en Curso
                        </span>
                      )}
                    </div>

                    {item.finalScore != null && (
                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-white bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-md">
                        <CheckCircle2 className="size-3 text-cyan-400" />
                        <span>
                          Calificación:{' '}
                          {formatScoreWithMax(item.finalScore, item.maxScore)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {item.eventName}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-slate-300">
                      <span className="flex items-center gap-1 text-slate-400">
                        <FolderGit2 className="size-3.5 text-cyan-400" />
                        Proyecto: <strong className="text-white">{item.projectName}</strong>
                      </span>
                      <span className="text-slate-600 hidden sm:inline" aria-hidden="true">·</span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <BookOpen className="size-3.5 text-pink-400" />
                        Categoría: <span className="text-slate-200">{item.courseName || 'Sin categoría'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Fila de Reconocimientos y Botón a Ficha Técnica del Proyecto */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5">
                    {item.award ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-200">
                        <Award className="size-3.5 text-amber-400" />
                        <span>Distinción obtenida: {item.award}</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium">
                        {item.isCurrent
                          ? 'Participación en curso'
                          : 'Edición académica finalizada'}
                      </span>
                    )}

                    {/* Botón de acceso a la Ficha Técnica reutilizando StudentProjectDashboardView */}
                    {item.eventId != null && (
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        size="sm"
                        variant="flat"
                        onPress={() => handleViewProject(item)}
                        className="flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all shadow-sm"
                        title={`Consultar la ficha técnica completa y rúbricas de ${item.projectName}`}
                      >
                        <FileText className="size-3.5" />
                        <span>{item.isCurrent ? 'Ver Proyecto Activo' : 'Ver Ficha Técnica'}</span>
                        <ArrowRight className="size-3" />
                      </Button>
                    </motion.div>
                    )}
                  </div>

                  {/* Diploma de premio del evento (solo si el backend lo ofrece) */}
                  {item.diplomaAvailable && item.eventId != null && (
                    <DiplomaDownload
                      eventId={item.eventId}
                      projectName={item.projectName}
                    />
                  )}
                </motion.div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
