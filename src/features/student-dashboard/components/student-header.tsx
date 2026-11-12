'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Calendar,
  Layers,
  Award,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { paths } from '@/config/paths';
import { StudentKpis, StudentProfile } from '../types';

export interface StudentHeaderProps {
  profile: StudentProfile;
  kpis: StudentKpis;
  eventName?: string;
  onBack?: () => void;
  onEditProfile?: () => void;
}

export const StudentHeader = ({
  profile,
  kpis,
  eventName,
  onBack,
  onEditProfile,
}: StudentHeaderProps) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push(paths.app.root.getHref());
    }
  };

  const handleEditProfile = () => {
    if (onEditProfile) {
      onEditProfile();
    } else {
      router.push(paths.app.profile.getHref());
    }
  };

  const initials = `${profile.firstName?.charAt(0) || ''}${profile.lastName?.charAt(0) || ''}`.toUpperCase() || 'ES';

  return (
    <header
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0e101a]/85 p-5 backdrop-blur-xl shadow-xl transition-all sm:p-6"
      aria-label="Cabecera y Resumen de Trayectoria del Estudiante"
    >
      {/* Glow ambiental decorativo de marca IRIS */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-cyan-500/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Identidad del Estudiante y Navegación (botón condicional si existe onBack) */}
        <div className="flex items-start gap-3.5 sm:items-center sm:gap-4">
          {onBack && (
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              aria-label="Volver a la vista principal"
              className="size-9 shrink-0 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/10"
              onPress={handleBack}
            >
              <ChevronLeft className="size-4" />
            </Button>
          )}

          {/* Avatar con Iniciales y Borde Neón */}
          <div
            className="flex size-13 sm:size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/25 via-slate-800 to-pink-500/25 border border-cyan-500/30 text-lg font-bold text-cyan-300 shadow-inner"
            aria-hidden="true"
          >
            {initials}
          </div>

          {/* Textos de Perfil */}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl sm:text-2xl font-bold tracking-tight text-white">
                {profile.firstName} {profile.lastName}
              </h1>
              <span className="inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-300">
                Estudiante Activo
              </span>
            </div>

            <p className="flex flex-wrap items-center gap-x-2 text-xs sm:text-sm text-slate-400">
              <span>
                Código estudiantil:{' '}
                <span className="font-mono font-medium text-slate-200">
                  {profile.studentCode || 'No registrado'}
                </span>
              </span>
              <span className="text-slate-600 hidden sm:inline" aria-hidden="true">·</span>
              <span className="truncate text-slate-300 font-medium">
                {profile.career}
              </span>
              <span className="text-slate-600 hidden sm:inline" aria-hidden="true">·</span>
              <span className="font-semibold text-cyan-400">
                {profile.semester}° Semestre
              </span>
            </p>

            {eventName && (
              <p className="text-xs text-default-500 pt-0.5 truncate">
                Feria activa:{' '}
                <span className="font-medium text-slate-300">{eventName}</span>
              </p>
            )}
          </div>
        </div>

        {/* 3 Tarjetas KPI Globales (Ferias, Proyectos, Distinciones) */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 w-full lg:w-auto">
          {/* KPI 1: Ferias */}
          <div
            className="group flex flex-col items-center justify-center rounded-xl border border-white/5 bg-black/30 px-3 py-2.5 text-center transition-all hover:border-cyan-500/30 hover:bg-cyan-500/5 sm:px-4 sm:py-3"
            title="Total de ferias académicas en las que ha participado"
          >
            <div className="flex items-center gap-1.5 text-cyan-400">
              <Calendar className="size-3.5 sm:size-4" />
              <span className="text-xl sm:text-2xl font-black tracking-tight">
                {kpis.totalFairs}
              </span>
            </div>
            <span className="mt-0.5 text-[12px] font-semibold uppercase tracking-wider text-slate-400">
              Ferias
            </span>
          </div>

          {/* KPI 2: Proyectos */}
          <div
            className="group flex flex-col items-center justify-center rounded-xl border border-white/5 bg-black/30 px-3 py-2.5 text-center transition-all hover:border-pink-500/30 hover:bg-pink-500/5 sm:px-4 sm:py-3"
            title="Total de proyectos presentados a lo largo de su carrera"
          >
            <div className="flex items-center gap-1.5 text-pink-400">
              <Layers className="size-3.5 sm:size-4" />
              <span className="text-xl sm:text-2xl font-black tracking-tight">
                {kpis.totalProjects}
              </span>
            </div>
            <span className="mt-0.5 text-[12px] font-semibold uppercase tracking-wider text-slate-400">
              Proyectos
            </span>
          </div>

          {/* KPI 3: Distinciones */}
          <div
            className="group flex flex-col items-center justify-center rounded-xl border border-white/5 bg-black/30 px-3 py-2.5 text-center transition-all hover:border-amber-500/30 hover:bg-amber-500/5 sm:px-4 sm:py-3"
            title="Total de premios o menciones de honor obtenidas"
          >
            <div className="flex items-center gap-1.5 text-amber-400">
              <Award className="size-3.5 sm:size-4" />
              <span className="text-xl sm:text-2xl font-black tracking-tight">
                {kpis.totalAwards}
              </span>
            </div>
            <span className="mt-0.5 text-[12px] font-semibold uppercase tracking-wider text-slate-400">
              Premios
            </span>
          </div>
        </div>

        {/* Botón de Perfil */}
        <div className="self-end lg:self-center">
          <Button
            size="sm"
            variant="flat"
            onPress={handleEditProfile}
            aria-label="Ir a editar mi perfil de estudiante"
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 hover:text-white transition-colors"
          >
            <UserCheck className="size-3.5 text-cyan-400" />
            <span>Editar Perfil</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

