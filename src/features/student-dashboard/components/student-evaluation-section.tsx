'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  Trophy,
  Award,
  Clock,
  Sparkles,
  MessageSquareQuote,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  FileSpreadsheet,
} from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { StudentEvaluation, StudentProfile, StudentProjectInfo } from '../types';
import { generateIndividualStudentReport } from '../utils/generate-student-report';

export interface StudentEvaluationSectionProps {
  evaluation: StudentEvaluation | null;
  profile?: StudentProfile;
  project?: StudentProjectInfo | null;
}

// Micro-variantes escalonadas (Propuesta B)
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};

export const StudentEvaluationSection = ({
  evaluation,
  profile,
  project,
}: StudentEvaluationSectionProps) => {
  const [isCommentsExpanded, setIsCommentsExpanded] = useState(false);
  // Estado de morphing para descarga (Propuesta D: idle -> loading -> success -> idle)
  const [downloadState, setDownloadState] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleDownloadExcel = async () => {
    if (!profile || downloadState !== 'idle') return;
    setDownloadState('loading');
    try {
      await generateIndividualStudentReport({
        profile,
        project: project ?? null,
        evaluation,
      });
      setDownloadState('success');
      setTimeout(() => {
        setDownloadState('idle');
      }, 2200);
    } catch (error) {
      console.error('Error al generar reporte de evaluación en Excel:', error);
      setDownloadState('idle');
    }
  };

  // Caso 1: Sin evaluación registrada aún
  if (!evaluation) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0e101a]/85 p-8 text-center backdrop-blur-xl space-y-3">
        <Clock className="mx-auto size-10 text-slate-500" />
        <h3 className="text-base font-bold text-white">Evaluación Pendiente</h3>
        <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
          Tu proyecto se encuentra listo. La jornada de sustentación y evaluación con los jurados asignados se llevará a cabo durante la feria. Una vez el comité publique los resultados oficiales, podrás consultar aquí tus notas y observaciones.
        </p>
      </div>
    );
  }

  // Caso 2: Pre-publicación (Resultados pendientes de publicación por el Administrador)
  if (!evaluation.resultsPublished) {
    return (
      <div
        className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-[#0e101a] to-transparent p-7 text-center backdrop-blur-xl shadow-xl space-y-4"
        aria-live="polite"
      >
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-inner">
          <Clock className="size-7" />
        </div>
        <div className="space-y-1.5 max-w-xl mx-auto">
          <h3 className="text-lg font-bold text-white tracking-tight">
            Calificaciones en Proceso de Consolidación
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Los jurados han ingresado sus evaluaciones y el comité académico se encuentra consolidando los resultados definitivos. Muy pronto podrás consultar tu nota final, posición y los comentarios recibidos.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-black/40 px-3.5 py-1 text-xs font-mono text-amber-300">
          <span className="size-2 rounded-full bg-amber-400" />
          <span>Etapa actual: Evaluación en proceso de cierre</span>
        </div>
      </div>
    );
  }

  // Caso 3: Resultados oficiales publicados
  const finalScore = evaluation.finalScore ?? 0;
  const maxScore = evaluation.maxScore ?? 5.0;
  const scorePercent = Math.min(100, Math.round((finalScore / maxScore) * 100));
  const ranking = evaluation.ranking;
  const criteria = evaluation.criteriaScores ?? [];
  const feedback = evaluation.consolidatedFeedback;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 rounded-2xl border border-white/10 bg-[#0e101a]/85 p-5 backdrop-blur-xl shadow-xl sm:p-7"
      aria-label="Módulo C: Calificaciones y Resultados Oficiales"
    >
      {/* Cabecera de Sección con Botón con Morphing de Estado (Propuesta D) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <Trophy className="size-5 text-amber-400" />
            <span>Resultados Oficiales de la Evaluación</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Métricas oficiales consolidadas y rúbricas otorgadas por el jurado evaluador.
          </p>
        </div>

        {profile && (
          <motion.button
            layout
            type="button"
            onClick={handleDownloadExcel}
            disabled={downloadState === 'loading'}
            whileHover={downloadState === 'idle' ? { scale: 1.02 } : undefined}
            whileTap={downloadState === 'idle' ? { scale: 0.98 } : undefined}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all shadow-md shrink-0 self-start sm:self-auto ${
              downloadState === 'success'
                ? 'border-emerald-400/80 bg-emerald-500/25 text-emerald-200 shadow-emerald-500/20'
                : downloadState === 'loading'
                ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300 opacity-90 cursor-wait'
                : 'border-emerald-500/40 bg-gradient-to-r from-emerald-600/30 to-teal-600/30 text-emerald-300 hover:from-emerald-600/40 hover:to-teal-600/40 shadow-emerald-500/10'
            }`}
            title="Descarga el reporte individual oficial de evaluación en Excel"
          >
            <AnimatePresence mode="wait">
              {downloadState === 'loading' && (
                <motion.span
                  key="loading"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-2"
                >
                  <Spinner size="sm" />
                  <span>Generando reporte...</span>
                </motion.span>
              )}

              {downloadState === 'success' && (
                <motion.span
                  key="success"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-2 text-emerald-200"
                >
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  <span>¡Descargado con éxito!</span>
                </motion.span>
              )}

              {downloadState === 'idle' && (
                <motion.span
                  key="idle"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-2"
                >
                  <FileSpreadsheet className="size-4 text-emerald-400" />
                  <span>Descargar Reporte (Excel)</span>
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </div>

      {/* Banner de Calificación y Posición en Ranking con Micro-elevación (Propuesta C) */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tarjeta de Puntaje Final Consolidado */}
        <motion.div
          whileHover={{ y: -1.5 }}
          transition={{ duration: 0.15 }}
          className="relative overflow-hidden rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 via-slate-900/60 to-black/40 p-5 shadow-lg hover:border-cyan-500/50 transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Puntaje Final Consolidado
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black tracking-tight text-white">
                  {finalScore.toFixed(2)}
                </span>
                <span className="text-sm font-semibold text-slate-400">
                  / {maxScore.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-slate-300 pt-1">
                Promedio aritmético consolidado de las evaluaciones recibidas.
              </p>
            </div>

            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/15 text-cyan-300 shadow-inner">
              <CheckCircle className="size-7" />
            </div>
          </div>

          {/* Barra de Progreso de Calificación */}
          <div className="mt-4 space-y-1">
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all duration-500"
                style={{ width: `${scorePercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[12px] font-mono text-slate-400">
              <span>0.0</span>
              <span>{scorePercent}% de la puntuación máxima</span>
              <span>{maxScore.toFixed(1)}</span>
            </div>
          </div>
        </motion.div>

        {/* Tarjeta de Posición en el Ranking (Soporte Coganador / Ganador) */}
        {ranking ? (
          <motion.div
            whileHover={{ y: -1.5 }}
            transition={{ duration: 0.15 }}
            className={`relative overflow-hidden rounded-xl border p-5 shadow-lg transition-colors ${
              ranking.isWinner || ranking.isCoWinner
                ? 'border-amber-500/35 bg-gradient-to-br from-amber-950/40 via-slate-900/60 to-black/40 hover:border-amber-500/50'
                : 'border-white/10 bg-white/5 hover:border-white/20'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Posición en Categoría
                </span>

                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                    Puesto {ranking.position}
                  </span>

                  {ranking.isCoWinner && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300 shadow-sm">
                      <Sparkles className="size-3" />
                      Coganador
                    </span>
                  )}

                  {ranking.isWinner && !ranking.isCoWinner && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300 shadow-sm">
                      <Trophy className="size-3" />
                      Primer Puesto
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 pt-1">
                  Categoría: <span className="font-semibold text-white">{ranking.categoryName}</span>
                </p>
                {ranking.awardTitle && (
                  <p className="text-xs font-medium text-amber-300 flex items-center gap-1.5 pt-0.5">
                    <Award className="size-3.5" />
                    <span>{ranking.awardTitle}</span>
                  </p>
                )}
              </div>

              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/15 text-amber-300 shadow-inner">
                <Trophy className="size-7" />
              </div>
            </div>

            <p className="mt-4 text-[12px] text-slate-400 border-t border-white/5 pt-2">
              {ranking.isCoWinner
                ? 'Empate técnico con mención de honor compartida con otro proyecto de la misma categoría.'
                : 'Posición oficial consolidada del proyecto en el certamen.'}
            </p>
          </motion.div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 flex items-center justify-center text-xs text-slate-400">
            Posición en ranking no disponible.
          </div>
        )}
      </motion.div>

      {/* Desglose de Criterios Evaluados (Medias Consolidadas) */}
      {criteria.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-3.5 border-t border-white/10 pt-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Desglose de Calificaciones por Criterio
            </h3>
            <span className="text-[12px] text-slate-400 font-medium">
              Promedios consolidados por rúbrica
            </span>
          </div>

          <div className="space-y-2.5">
            {criteria.map((item) => {
              const itemPercent = Math.min(
                100,
                Math.round((item.score / item.maxScore) * 100)
              );

              return (
                <motion.div
                  key={item.id}
                  whileHover={{ y: -1 }}
                  transition={{ duration: 0.12 }}
                  className="rounded-xl border border-white/5 bg-black/25 p-3.5 transition-colors hover:border-cyan-500/20"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="text-white">{item.criterion}</span>
                      {item.component && (
                        <span className="rounded bg-white/5 border border-white/10 px-1.5 py-0.2 text-[12px] font-normal text-slate-400">
                          {item.component}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 font-mono self-end sm:self-auto">
                      <span className="text-cyan-400 font-bold">
                        {item.score.toFixed(1)}
                      </span>
                      <span className="text-slate-500">/ {item.maxScore.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-cyan-400 transition-all duration-300"
                      style={{ width: `${itemPercent}%` }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Retroalimentación Cualitativa Consolidada con Despliegue Suave (Propuesta E) */}
      {feedback && (
        <motion.div variants={itemVariants} className="space-y-3 border-t border-white/10 pt-5">
          <div className="flex items-center gap-2">
            <MessageSquareQuote className="size-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Retroalimentación Cualitativa Consolidada
            </h3>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/30 p-4.5 space-y-3">
            <motion.div
              layout
              initial={false}
              animate={{ height: isCommentsExpanded ? 'auto' : '4.5rem' }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="relative overflow-hidden"
            >
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed italic">
                &ldquo;{feedback}&rdquo;
              </p>

              {/* Degradado sutil inferior cuando está colapsado */}
              {!isCommentsExpanded && feedback.length > 180 && (
                <div
                  className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-[#0e101a] to-transparent pointer-events-none"
                  aria-hidden="true"
                />
              )}
            </motion.div>

            <div className="flex items-center justify-between border-t border-white/5 pt-2 text-[12px] text-slate-400">
              <span className="font-semibold text-cyan-300/80">
                Observaciones anónimas de jurados evaluadores
              </span>

              {feedback.length > 180 && (
                <button
                  type="button"
                  onClick={() => setIsCommentsExpanded(!isCommentsExpanded)}
                  className="h-auto p-0 text-[12px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                >
                  <span>{isCommentsExpanded ? 'Mostrar menos' : 'Leer completo'}</span>
                  <motion.span
                    animate={{ rotate: isCommentsExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="inline-block"
                  >
                    <ChevronDown className="size-3.5" />
                  </motion.span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

