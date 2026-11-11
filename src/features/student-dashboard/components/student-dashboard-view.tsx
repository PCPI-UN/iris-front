'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  BarChart3,
  History,
  Award,
} from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { StudentDashboardData, StudentProjectInfo } from '../types';
import {
  useStudentDashboard,
  useUpdateStudentProject,
} from '../api/get-student-dashboard';
import { StudentHeader } from './student-header';
import { StudentProjectSection } from './student-project-section';
import { StudentEvaluationSection } from './student-evaluation-section';
import { StudentHistorySection } from './student-history-section';
import { StudentCertificatesSection } from './student-certificates-section';

export type StudentDashboardTab =
  | 'project'
  | 'evaluation'
  | 'history'
  | 'certificates';

export interface StudentDashboardViewProps {
  initialData?: StudentDashboardData;
  defaultTab?: StudentDashboardTab;
  onBack?: () => void;
  eventId?: number;
}

export const StudentDashboardView = ({
  initialData,
  defaultTab = 'project',
  onBack,
  eventId,
}: StudentDashboardViewProps) => {
  const [activeTab, setActiveTab] = useState<StudentDashboardTab>(defaultTab);

  // Hook React Query para resolver datos según la sesión autenticada
  const { data: remoteData, isLoading } = useStudentDashboard(
    eventId ?? 'current',
  );
  const data = initialData || remoteData;
  const updateProjectMutation = useUpdateStudentProject({
    eventId: data?.currentProject?.eventId ?? eventId,
  });

  if (isLoading || !data) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const { profile, kpis, currentProject, evaluation, trajectory, certificates } = data;

  const handleSaveProjectChanges = async (
    updatedProject: Partial<StudentProjectInfo>,
  ) => {
    if (!currentProject?.id) return;
    await updateProjectMutation.mutateAsync({
      projectId: currentProject.id,
      data: {
        name: updatedProject.name ?? currentProject.name,
        description: updatedProject.description ?? currentProject.description,
      },
    });
  };

  const getEvaluationBadge = () => {
    if (!evaluation) return null;
    if (!evaluation.resultsPublished) {
      return (
        <span className="rounded bg-amber-500/20 px-1.5 py-0.2 font-mono text-[12px] font-semibold text-amber-300">
          En revisión
        </span>
      );
    }
    return (
      <span className="rounded bg-cyan-500/20 px-1.5 py-0.2 font-mono text-[12px] font-bold text-cyan-300">
        {evaluation.finalScore?.toFixed(1) || '4.8'}
      </span>
    );
  };

  return (
    <section
      className="dashboard-page space-y-6 pb-12"
      aria-label="Dashboard del Estudiante"
    >
      {/* MÓDULO A: Cabecera y Resumen de Trayectoria (Fijo) */}
      <StudentHeader
        profile={profile}
        kpis={kpis}
        eventName={currentProject?.eventName}
        onBack={onBack}
      />

      {/* Navegación por Pestañas con Píldora Deslizante (layoutId) */}
      <nav
        aria-label="Secciones del Dashboard"
        className="flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-[#0e101a]/85 p-1.5 backdrop-blur-xl shadow-lg"
      >
        {/* Tab 1: Proyecto e Inscripción */}
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
              layoutId="activeMasterTabPill"
              className="absolute inset-0 rounded-xl border border-cyan-500/40 bg-cyan-500/15 shadow-md shadow-cyan-500/10 pointer-events-none"
              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <FileText className="size-4" />
            <span>Proyecto Actual</span>
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

        {/* Tab 2: Evaluación y Calificaciones */}
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
              layoutId="activeMasterTabPill"
              className="absolute inset-0 rounded-xl border border-cyan-500/40 bg-cyan-500/15 shadow-md shadow-cyan-500/10 pointer-events-none"
              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <BarChart3 className="size-4" />
            <span>Evaluación y Calificaciones</span>
            {getEvaluationBadge()}
          </span>
        </button>

        {/* Tab 3: Trayectoria e Historial */}
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`relative flex items-center gap-2 rounded-xl px-4 sm:px-5 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'history'
              ? 'text-cyan-300'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          {activeTab === 'history' && (
            <motion.div
              layoutId="activeMasterTabPill"
              className="absolute inset-0 rounded-xl border border-cyan-500/40 bg-cyan-500/15 shadow-md shadow-cyan-500/10 pointer-events-none"
              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <History className="size-4" />
            <span>Trayectoria e Historial</span>
            <span className="rounded bg-white/5 border border-white/10 px-1.5 py-0.2 font-mono text-[12px] text-slate-300">
              {trajectory.length}
            </span>
          </span>
        </button>

        {/* Tab 4: Diplomas y Reportes */}
        <button
          type="button"
          onClick={() => setActiveTab('certificates')}
          className={`relative flex items-center gap-2 rounded-xl px-4 sm:px-5 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'certificates'
              ? 'text-cyan-300'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          {activeTab === 'certificates' && (
            <motion.div
              layoutId="activeMasterTabPill"
              className="absolute inset-0 rounded-xl border border-cyan-500/40 bg-cyan-500/15 shadow-md shadow-cyan-500/10 pointer-events-none"
              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <Award className="size-4" />
            <span>Diplomas y Certificados</span>
            {certificates.length > 0 && (
              <span className="rounded bg-pink-500/15 border border-pink-500/30 px-1.5 py-0.2 font-mono text-[12px] font-semibold text-pink-300">
                {certificates.length}
              </span>
            )}
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
            <StudentProjectSection
              project={currentProject}
              onSaveChanges={handleSaveProjectChanges}
            />
          )}

          {activeTab === 'evaluation' && (
            <StudentEvaluationSection evaluation={evaluation} />
          )}

          {activeTab === 'history' && (
            <StudentHistorySection trajectory={trajectory} />
          )}

          {activeTab === 'certificates' && (
            <StudentCertificatesSection
              certificates={certificates}
              project={currentProject}
              evaluation={evaluation}
              profile={profile}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
};

