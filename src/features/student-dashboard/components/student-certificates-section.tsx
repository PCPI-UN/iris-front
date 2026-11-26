'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  FileSpreadsheet,
  Download,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { paths } from '@/config/paths';
import { DiplomaCertificate, StudentEvaluation, StudentProfile, StudentProjectInfo } from '../types';
import { getCertificateDownloadUrl } from '../api/get-student-dashboard';
import { generateIndividualStudentReport } from '../utils/generate-student-report';

export interface StudentCertificatesSectionProps {
  certificates: DiplomaCertificate[];
  project: StudentProjectInfo | null;
  evaluation: StudentEvaluation | null;
  profile: StudentProfile;
}

export const StudentCertificatesSection = ({
  certificates,
  project,
  evaluation,
  profile,
}: StudentCertificatesSectionProps) => {
  const router = useRouter();
  // Estado de morphing para descarga (Propuesta D)
  const [downloadState, setDownloadState] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleDownloadExcel = async () => {
    if (downloadState !== 'idle') return;
    setDownloadState('loading');
    try {
      await generateIndividualStudentReport({
        profile,
        project,
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

  const handleGoToPastEvents = () => {
    router.push(paths.public.event.getHref());
  };

  return (
    <div className="space-y-6">
      {/* MÓDULO E: Diplomas y Reporte Individual */}
      <div
        className="space-y-6 rounded-2xl border border-white/10 bg-[#0e101a]/85 p-5 backdrop-blur-xl shadow-xl sm:p-7"
        aria-label="Módulo E: Certificados, Diplomas y Reportes"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <Award className="size-5 text-pink-400" />
              <span>Certificados Oficiales & Diplomas</span>
            </h2>
            <p className="text-xs text-slate-400">
              Descarga tus diplomas de participación o mérito y exporta el reporte individual oficial.
            </p>
          </div>

          {/* Botón de Acción Principal Oficial (Excel) con Morphing (Propuesta D) */}
          <motion.button
            layout
            type="button"
            onClick={handleDownloadExcel}
            disabled={downloadState === 'loading'}
            whileHover={downloadState === 'idle' ? { scale: 1.02 } : undefined}
            whileTap={downloadState === 'idle' ? { scale: 0.98 } : undefined}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all shadow-lg shrink-0 self-start sm:self-auto ${
              downloadState === 'success'
                ? 'border-emerald-400/80 bg-emerald-500/25 text-emerald-200 shadow-emerald-500/20'
                : downloadState === 'loading'
                ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300 opacity-90 cursor-wait'
                : 'border-emerald-500/40 bg-gradient-to-r from-emerald-600/30 to-teal-600/30 text-emerald-300 hover:from-emerald-600/40 hover:to-teal-600/40 shadow-emerald-500/10'
            }`}
            title="Descarga el reporte oficial individual según formato Reporte_Evaluacion_Feria_Proyectos_aprobado.xlsx"
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
                  <span>Descargar Reporte Individual (Excel)</span>
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Listado de Tarjetas de Diplomas con Micro-elevación (Propuesta C) */}
        {certificates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certificates.map((cert) => {
              const isWinner =
                cert.type === 'WINNER' || cert.type === 'CO_WINNER';

              return (
                <motion.div
                  key={cert.id}
                  whileHover={{ y: -1.5 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/25 p-4 transition-colors hover:border-white/20 hover:bg-black/40"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${
                        isWinner
                          ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                          : 'border-pink-500/40 bg-pink-500/15 text-pink-300'
                      }`}
                    >
                      {isWinner ? (
                        <Sparkles className="size-5" />
                      ) : (
                        <ShieldCheck className="size-5" />
                      )}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <p className="text-xs sm:text-sm font-bold text-white truncate">
                        {cert.title}
                      </p>
                      <p className="text-[12px] text-slate-400">
                        {cert.eventName}
                      </p>
                      {cert.issuedDate && (
                        <p className="text-[11px] font-mono text-slate-500">
                          Emitido: {cert.issuedDate}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    {cert.isIssued ? (
                      <motion.a
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        href={getCertificateDownloadUrl(cert.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 rounded-xl border border-pink-500/40 bg-pink-500/15 px-3 py-2 text-xs font-semibold text-pink-200 hover:bg-pink-500/25 transition-all shadow-sm"
                      >
                        <Download className="size-3.5" />
                        <span>Descargar PDF</span>
                      </motion.a>
                    ) : (
                      <div
                        className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300"
                        title="El certificado se encuentra en proceso formal de emisión por la secretaría académica"
                      >
                        <Clock className="size-3 text-amber-400" />
                        <span>En trámite</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-slate-400">
            No se registran certificados emitidos en la plataforma aún.
          </div>
        )}
      </div>

      {/* MÓDULO F: Acceso al Histórico General de Ferias de la Universidad */}
      <motion.div
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
            onPress={handleGoToPastEvents}
            className="flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/15 px-4 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/25 transition-all"
          >
            <span>Explorar Ganadores</span>
            <ExternalLink className="size-3.5" />
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

