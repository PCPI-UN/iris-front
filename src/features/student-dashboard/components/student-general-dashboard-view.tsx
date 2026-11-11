'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion, Variants } from 'framer-motion';
import {
  FolderGit2,
  Calendar,
  ArrowRight,
  ExternalLink,
  Building2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { paths } from '@/config/paths';
import { StudentDashboardData } from '../types';
import { useStudentDashboard } from '../api/get-student-dashboard';
import { StudentHeader } from './student-header';
import { StudentHistorySection } from './student-history-section';

export interface StudentGeneralDashboardViewProps {
  initialData?: StudentDashboardData;
}

// Variantes de micro-animación escalonada sin sobrecarga (Propuesta B)
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.22,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};

export const StudentGeneralDashboardView = ({
  initialData,
}: StudentGeneralDashboardViewProps) => {
  const router = useRouter();
  const { data: remoteData, isLoading } = useStudentDashboard();
  const data = initialData || remoteData;

  if (isLoading || !data) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const { profile, kpis, currentProject, evaluation, trajectory } = data;
  const hasPublishedResults = Boolean(evaluation?.resultsPublished);

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
            Inscripción Aprobada
          </span>
        );
      case 'REQUEST_CHANGES':
        return (
          <span className="rounded-full border border-cyan-500/40 bg-cyan-500/15 px-2.5 py-0.5 text-xs font-semibold text-cyan-300">
            Cambios Solicitados
          </span>
        );
      case 'REJECTED':
        return (
          <span className="rounded-full border border-rose-500/40 bg-rose-500/15 px-2.5 py-0.5 text-xs font-semibold text-rose-300">
            Inscripción Rechazada
          </span>
        );
      default:
        return (
          <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
            En Revisión
          </span>
        );
    }
  };

  const handleGoToCurrentProject = () => {
    const targetEventId = currentProject?.eventId ? String(currentProject.eventId) : '3';
    router.push(`/app/events/${targetEventId}/dashboard`);
  };

  const handleGoToPastEventsRepo = () => {
    router.push(paths.public.event.getHref());
  };

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="dashboard-page space-y-7 pb-12"
      aria-label="Dashboard General del Estudiante"
    >
      {/* MÓDULO A: Cabecera con datos de estudiante y los 3 KPIs de carrera */}
      <motion.div variants={itemVariants}>
        <StudentHeader profile={profile} kpis={kpis} />
      </motion.div>

      {/* SECCIÓN 1: Proyecto / Feria Activa en Curso */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <Sparkles className="size-4.5 text-cyan-400" />
            <span>Feria y Proyecto Activo</span>
          </h2>
          {currentProject && (
            <span className="text-xs text-slate-400 font-mono">
              Semestre {currentProject.semester || '2026-1'}
            </span>
          )}
        </div>

        {currentProject ? (
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.15 }}
            className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/20 via-[#0e101a] to-black/50 p-5 sm:p-6 backdrop-blur-xl shadow-xl transition-colors hover:border-cyan-500/50 hover:shadow-cyan-500/5"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="space-y-2.5 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-0.5 rounded-md">
                    <Calendar className="size-3 text-cyan-400" />
                    {currentProject.eventName}
                  </span>
                  {getStatusBadge(currentProject.enrollmentStatus)}
                  {currentProject.categoryName && (
                    <span className="text-xs text-slate-400 font-medium">
                      Categoría: {currentProject.categoryName}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    {currentProject.name || currentProject.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {currentProject.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                  <span className="flex items-center gap-1.5">
                    <FolderGit2 className="size-3.5 text-cyan-400" />
                    <span>
                      {currentProject.participantsCount ??
                        currentProject.participants?.length ??
                        1}{' '}
                      Integrantes
                    </span>
                  </span>
                  <span className="text-slate-600" aria-hidden="true">·</span>
                  <span>
                    {currentProject.documentsCount ??
                      currentProject.documents?.length ??
                      0}{' '}
                    Documentos entregados
                  </span>
                </div>
              </div>

              {/* Botón de Acción Directa hacia el Dashboard de Proyecto con Micro-elevación háptica */}
              <div className="shrink-0 flex items-center lg:self-center">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onPress={handleGoToCurrentProject}
                    variant="flat"
                    size="md"
                    className="w-full sm:w-auto flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/20 px-5 py-3 text-xs sm:text-sm font-bold text-cyan-200 hover:bg-cyan-500/30 transition-all shadow-lg shadow-cyan-500/10"
                  >
                    <span>
                      {hasPublishedResults
                        ? 'Ver Ficha y Calificaciones'
                        : 'Ver Ficha del Proyecto'}
                    </span>
                    <ArrowRight className="size-4" />
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-[#0e101a]/70 p-6 text-center backdrop-blur-xl">
            <Clock className="mx-auto size-8 text-slate-500 mb-2" />
            <h3 className="text-sm font-bold text-white">
              No tienes un proyecto inscrito en la feria activa
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Cuando te inscribas a una feria en curso, tu proyecto y calificaciones se desplegarán aquí.
            </p>
          </div>
        )}
      </motion.div>

      {/* SECCIÓN 2: Trayectoria e Historial Académico con Diplomas Asociados */}
      <motion.div variants={itemVariants} className="space-y-3">
        <StudentHistorySection trajectory={trajectory} />
      </motion.div>

      {/* SECCIÓN 3: Repositorio General de Proyectos Ganadores */}
      <motion.div
        variants={itemVariants}
        whileHover={{ y: -1.5 }}
        transition={{ duration: 0.15 }}
        className="rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/25 via-[#0c0e17]/80 to-pink-950/25 p-5 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-cyan-500/40 transition-colors"
        aria-label="Módulo F: Acceso al Histórico General de Ferias"
      >
        <div className="flex items-start gap-3.5">
          <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/15 text-cyan-300">
            <Building2 className="size-5" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Repositorio de Proyectos Ganadores Históricos
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
              Consulta las iniciativas ganadoras de ediciones previas de la Universidad del Norte para inspirarte y contrastar estándares de premiación.
            </p>
          </div>
        </div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="shrink-0 self-end sm:self-auto">
          <Button
            size="sm"
            variant="flat"
            onPress={handleGoToPastEventsRepo}
            className="flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/15 px-4 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/25 transition-all"
          >
            <span>Explorar Ganadores</span>
            <ExternalLink className="size-3.5" />
          </Button>
        </motion.div>
      </motion.div>
    </motion.section>
  );
};
