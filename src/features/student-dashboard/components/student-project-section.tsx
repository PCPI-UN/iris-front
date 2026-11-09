'use client';

import React, { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import {
  FileText,
  FileCode,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  ExternalLink,
  Edit2,
  Save,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EnrollmentStatus, StudentProjectInfo } from '../types';

export interface StudentProjectSectionProps {
  project: StudentProjectInfo | null;
  onSaveChanges?: (updatedProject: Partial<StudentProjectInfo>) => Promise<void> | void;
}

// Variantes escalonadas sutiles (Propuesta B)
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

export const StudentProjectSection = ({
  project,
  onSaveChanges,
}: StudentProjectSectionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(project?.name || '');
  const [editedDescription, setEditedDescription] = useState(
    project?.description || ''
  );
  const [isSaving, setIsSaving] = useState(false);

  if (!project) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0e101a]/85 p-8 text-center backdrop-blur-xl">
        <p className="text-base text-slate-400">
          No tienes ningún proyecto activo registrado para este evento.
        </p>
      </div>
    );
  }

  const getStatusLabel = (status: EnrollmentStatus): string => {
    switch (status) {
      case 'APPROVED':
        return 'Inscripción Aprobada';
      case 'REQUEST_CHANGES':
        return 'Cambios Solicitados';
      case 'REJECTED':
        return 'Inscripción Rechazada';
      case 'PENDING':
      default:
        return 'En Revisión';
    }
  };

  const renderStatusBanner = (status: EnrollmentStatus) => {
    switch (status) {
      case 'APPROVED':
        return {
          icon: <CheckCircle2 className="size-5 text-emerald-400" />,
          title: 'Inscripción Aprobada',
          description:
            '¡Excelente noticia! Tu proyecto ha sido revisado y aprobado formalmente para participar en la feria.',
          badgeClass:
            'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
          containerClass:
            'from-emerald-500/10 via-slate-900/60 to-transparent border-emerald-500/30',
        };
      case 'REQUEST_CHANGES':
        return {
          icon: <AlertCircle className="size-5 text-cyan-400" />,
          title: 'Ajustes Solicitados por el Comité',
          description:
            'El comité organizador ha solicitado ajustes en tu propuesta. Puedes modificar el título y resumen a continuación.',
          badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
          containerClass:
            'from-cyan-500/10 via-slate-900/60 to-transparent border-cyan-500/30',
        };
      case 'REJECTED':
        return {
          icon: <XCircle className="size-5 text-rose-400" />,
          title: 'Inscripción no admitida',
          description:
            'Tu propuesta no cumple con los criterios mínimos de la convocatoria. Si tienes dudas, comunícate con la coordinación académica.',
          badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
          containerClass:
            'from-rose-500/10 via-slate-900/60 to-transparent border-rose-500/30',
        };
      case 'PENDING':
      default:
        return {
          icon: <Clock className="size-5 text-amber-400" />,
          title: 'Inscripción en Proceso de Revisión',
          description:
            'El comité organizador se encuentra validando los documentos y la información suministrada.',
          badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
          containerClass:
            'from-amber-500/10 via-slate-900/60 to-transparent border-amber-500/30',
        };
    }
  };

  const statusMeta = renderStatusBanner(project.enrollmentStatus);

  const handleStartEdit = () => {
    setEditedName(project.name);
    setEditedDescription(project.description);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedName(project.name);
    setEditedDescription(project.description);
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (onSaveChanges) {
        await onSaveChanges({
          name: editedName,
          description: editedDescription,
        });
      }
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const primaryPoster = project.documents.find((d) => d.type === 'POSTER');
  const otherDocuments = project.documents.filter((d) => d.type !== 'POSTER');

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 rounded-2xl border border-white/10 bg-[#0e101a]/85 p-5 backdrop-blur-xl shadow-xl sm:p-7"
      aria-label="Módulo B: Proyecto Actual y Estado"
    >
      {/* Banner de Estado de Inscripción */}
      <motion.div
        variants={itemVariants}
        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border bg-gradient-to-r p-4.5 ${statusMeta.containerClass}`}
      >
        <div className="flex items-start gap-3.5">
          <div className="mt-0.5 shrink-0">{statusMeta.icon}</div>
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-white">
                {statusMeta.title}
              </span>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusMeta.badgeClass}`}
              >
                {getStatusLabel(project.enrollmentStatus)}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {statusMeta.description}
            </p>
          </div>
        </div>

        {/* Botón condicional de Modificar Proyecto */}
        <div className="self-end sm:self-center shrink-0">
          {project.canEdit && !isEditing ? (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                size="sm"
                variant="flat"
                onPress={handleStartEdit}
                className="flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-3.5 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/25 transition-all"
              >
                <Edit2 className="size-3.5" />
                <span>Modificar Proyecto</span>
              </Button>
            </motion.div>
          ) : isEditing ? (
            <div className="flex items-center gap-2">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="sm"
                  variant="flat"
                  onPress={handleSave}
                  isLoading={isSaving}
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-3.5 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30 transition-all"
                >
                  <Save className="size-3.5" />
                  <span>Guardar Cambios</span>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="sm"
                  variant="flat"
                  onPress={handleCancelEdit}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 transition-all"
                >
                  <X className="size-3.5" />
                  <span>Cancelar</span>
                </Button>
              </motion.div>
            </div>
          ) : (
            <span
              className="inline-flex items-center rounded-lg border border-white/5 bg-black/25 px-3 py-1.5 text-xs font-medium text-slate-400 cursor-not-allowed opacity-75"
              title="La modificación del proyecto se habilitará en caso de que el comité evaluador solicite correcciones."
            >
              Edición no disponible
            </span>
          )}
        </div>
      </motion.div>

      {/* Ficha Técnica del Proyecto */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-1">
        {/* Columna Izquierda: Información Principal y Documentación */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div variants={itemVariants} className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/25 px-2 py-0.5 rounded-md">
                {project.projectCode || 'CÓDIGO PENDIENTE'}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Categoría:{' '}
                <span className="text-slate-200 font-semibold">
                  {project.categoryName || 'General'}
                </span>
              </span>
            </div>

            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="edit-project-name"
                    className="block text-xs font-semibold uppercase text-slate-400 mb-1"
                  >
                    Título del Proyecto
                  </label>
                  <input
                    id="edit-project-name"
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-sm font-bold text-white focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                    maxLength={255}
                  />
                </div>
                <div>
                  <label
                    htmlFor="edit-project-desc"
                    className="block text-xs font-semibold uppercase text-slate-400 mb-1"
                  >
                    Resumen Ejecutivo del Proyecto
                  </label>
                  <textarea
                    id="edit-project-desc"
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-xs text-slate-200 leading-relaxed focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                    maxLength={3000}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-snug">
                  {project.name}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {project.description ||
                    'Sin descripción registrada para este proyecto.'}
                </p>
              </div>
            )}
          </motion.div>

          {/* Bloque de Documentación y Entregables */}
          <motion.div variants={itemVariants} className="space-y-2.5 border-t border-white/10 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Documentación y Entregables del Proyecto
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Póster Oficial */}
              {primaryPoster ? (
                <motion.a
                  whileHover={{ y: -1.5 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  href={primaryPoster.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3.5 transition-colors hover:border-cyan-500/35 hover:bg-cyan-500/5"
                  aria-label={`Ver póster oficial: ${primaryPoster.title}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400 group-hover:scale-105 transition-transform">
                      <FileText className="size-4.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white group-hover:text-cyan-300 truncate">
                        {primaryPoster.title || 'Póster Oficial'}
                      </p>
                      <p className="text-[12px] text-slate-400">
                        Póster Oficial en PDF
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="size-4 text-slate-500 group-hover:text-cyan-400 transition-colors shrink-0 ml-2" />
                </motion.a>
              ) : (
                <div className="rounded-xl border border-dashed border-white/10 p-3 text-center text-xs text-slate-400">
                  Póster pendiente de carga
                </div>
              )}

              {/* Otros Documentos / Memoria Técnica */}
              {otherDocuments.length > 0 ? (
                otherDocuments.map((doc) => (
                  <motion.a
                    key={doc.id}
                    whileHover={{ y: -1.5 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3.5 transition-colors hover:border-pink-500/35 hover:bg-pink-500/5"
                    aria-label={`Ver documento: ${doc.title}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-pink-500/15 text-pink-400 group-hover:scale-105 transition-transform">
                        <FileCode className="size-4.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white group-hover:text-pink-300 truncate">
                          {doc.title || 'Memoria Técnica'}
                        </p>
                        <p className="text-[12px] text-slate-400">
                          Memoria Técnica de Soporte
                        </p>
                      </div>
                    </div>
                    <ExternalLink className="size-4 text-slate-500 group-hover:text-pink-400 transition-colors shrink-0 ml-2" />
                  </motion.a>
                ))
              ) : (
                <div className="flex items-center justify-center rounded-xl border border-dashed border-white/10 p-3 text-xs text-slate-400">
                  Sin memorias o documentos adicionales registrados
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Columna Derecha: Equipo del Proyecto */}
        <motion.div variants={itemVariants} className="space-y-3.5 rounded-xl border border-white/10 bg-black/25 p-4 sm:p-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Equipo Participante
              </h3>
            </div>
            <span className="font-mono text-xs text-cyan-400 font-semibold">
              {project.participants.length} integrantes vinculados
            </span>
          </div>

          <ul className="space-y-3">
            {project.participants.map((member) => {
              const isLeader = member.role === 'Líder';
              const memberInitials = `${member.firstName?.charAt(0) || ''}${member.lastName?.charAt(0) || ''}`.toUpperCase();

              return (
                <li
                  key={member.id}
                  className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-2.5 transition-colors hover:border-white/10"
                >
                  <div
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isLeader
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {memberInitials}
                  </div>

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <p className="truncate text-xs font-bold text-white">
                        {member.firstName} {member.lastName}
                      </p>
                      {isLeader && (
                        <span className="shrink-0 rounded bg-cyan-500/15 px-1.5 py-0.2 text-[12px] font-semibold text-cyan-300">
                          Líder
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-slate-400 truncate">
                      {member.career || 'Estudiante'} · {member.studentCode}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </motion.div>
      </div>
    </motion.div>
  );
};

