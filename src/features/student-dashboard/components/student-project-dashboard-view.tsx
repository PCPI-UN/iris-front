'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  BarChart3,
  ChevronLeft,
  Calendar,
  Building2,
  Lock,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { StudentDashboardData } from '../types';
import { useStudentDashboard } from '../api/get-student-dashboard';
import { StudentProjectSection } from './student-project-section';
import { StudentEvaluationSection } from './student-evaluation-section';

export type StudentProjectTab = 'project' | 'evaluation';

export interface StudentProjectDashboardViewProps {
  initialData?: StudentDashboardData;
  defaultTab?: StudentProjectTab;
  onBack?: () => void;
  eventId?: number | string;
}

export const StudentProjectDashboardView = ({
  initialData,
  defaultTab = 'project',
  onBack,
  eventId,
}: StudentProjectDashboardViewProps) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<StudentProjectTab>(defaultTab);

  const { data: remoteData, isLoading } = useStudentDashboard(eventId);
  const data = initialData || remoteData;

  if (isLoading || !data) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const { profile, currentProject, evaluation } = data;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push('/app');
    }
  };

  const isEvaluationPublished = Boolean(evaluation?.resultsPublished);

  const renderEvaluationTabMeta = () => {
    if (!evaluation) {
      return {
        label: 'Resultados',
        icon: <Clock className="size-4 text-slate-400" />,
        badge: (
          <span className="inline-flex items-center gap-1 rounded bg-white/10 px-1.5 py-0.5 font-mono text-[11px] font-medium text-slate-300">
            <Clock className="size-2.5 text-slate-400" />
            <span>Pendiente</span>
          </span>
        ),
      };
    }

    if (!evaluation.resultsPublished) {
      return {
        label: 'Resultados',
        icon: <Lock className="size-4 text-amber-400" />,
        badge: (
          <span className="inline-flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/20 px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-300">
            <Lock className="size-2.5 text-amber-400" />
            <span>En consolidación</span>
          </span>
        ),
      };
    }

    return {
      label: 'Resultados y Calificaciones',
      icon: <BarChart3 className="size-4 text-cyan-400" />,
      badge: (
        <span className="rounded border border-cyan-500/30 bg-cyan-500/20 px-2 py-0.5 font-mono text-[12px] font-bold text-cyan-300">
          {evaluation.finalScore?.toFixed(2) || '4.85'}
        </span>
      ),
    };
  };

  const evalMeta = renderEvaluationTabMeta();

  return (
    <section
      className="dashboard-page space-y-6 pb-12"
      aria-label="Dashboard del Proyecto Estudiantil"
    >
      {/* Cabecera Específica del Proyecto */}
      <header className="rounded-2xl border border-white/10 bg-[#0e101a]/85 p-5 backdrop-blur-xl shadow-xl sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              aria-label="Volver al Dashboard General"
              onPress={handleBack}
              className="rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <ChevronLeft className="size-4.5" />
            </Button>
            <div>
              <span className="text-[11px] font-semibold tracking-wider text-cyan-400 uppercase">
                {currentProject?.canEdit ? 'Feria de Proyectos' : 'Historial de Proyecto'}
              </span>
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>{currentProject?.eventName || 'Feria de Proyectos'}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-300 bg-white/5 border border-white/10 px-3 py-1 rounded-lg">
              <Calendar className="size-3 text-cyan-400" />
              <span>
                {currentProject?.semester
                  ? `Semestre ${currentProject.semester}`
                  : 'Semestre 2026-1'}
              </span>
            </span>
          </div>
        </div>

        {/* Resumen del proyecto asociado */}
        {currentProject && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="space-y-0.5">
              <span className="text-xs text-slate-400">Proyecto postulado:</span>
              <h2 className="text-sm sm:text-base font-bold text-white">
                {currentProject.name || currentProject.title}
              </h2>
            </div>
            {currentProject.categoryName && (
              <span className="text-xs font-medium text-slate-300 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg">
                Categoría: {currentProject.categoryName}
              </span>
            )}
          </div>
        )}
      </header>

      {/* Navegación por Pestañas del Proyecto con Píldora Deslizante (layoutId) */}
      <nav
        aria-label="Pestañas del Proyecto"
        className="flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-[#0e101a]/85 p-1.5 backdrop-blur-xl shadow-lg"
      >
        {/* Tab 1: Ficha del Proyecto */}
        <button
          type="button"
          onClick={() => setActiveTab('project')}
          className={`relative flex items-center gap-2 rounded-xl px-4 sm:px-5 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'project'
              ? 'text-cyan-300'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          {activeTab === 'project' && (
            <motion.div
              layoutId="activeProjectTabPill"
              className="absolute inset-0 rounded-xl border border-cyan-500/40 bg-cyan-500/15 shadow-md shadow-cyan-500/10 pointer-events-none"
              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <FileText className="size-4" />
            <span>Ficha del Proyecto</span>
            {currentProject && (
              <span
                className={`size-2 rounded-full ${
                  currentProject.enrollmentStatus === 'APPROVED'
                    ? 'bg-emerald-400'
                    : currentProject.enrollmentStatus === 'REQUEST_CHANGES'
                    ? 'bg-cyan-400'
                    : 'bg-amber-400'
                }`}
              />
            )}
          </span>
        </button>

        {/* Tab 2: Evaluación y Calificaciones con estado dinámico institucional */}
        <button
          type="button"
          onClick={() => setActiveTab('evaluation')}
          className={`relative flex items-center gap-2 rounded-xl px-4 sm:px-5 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'evaluation'
              ? 'text-cyan-300'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          {activeTab === 'evaluation' && (
            <motion.div
              layoutId="activeProjectTabPill"
              className="absolute inset-0 rounded-xl border border-cyan-500/40 bg-cyan-500/15 shadow-md shadow-cyan-500/10 pointer-events-none"
              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            {evalMeta.icon}
            <span>{evalMeta.label}</span>
            {evalMeta.badge}
          </span>
        </button>
      </nav>

      {/* Contenedor de la Pestaña Activa con Transición Suave */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="tab-panel"
        >
          {activeTab === 'project' && (
            <StudentProjectSection project={currentProject} />
          )}

          {activeTab === 'evaluation' && (
            <StudentEvaluationSection
              evaluation={evaluation}
              profile={profile}
              project={currentProject}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
};
