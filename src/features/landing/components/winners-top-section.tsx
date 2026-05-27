'use client';

import { RefObject } from 'react';
import { ArrowRight, Star, Trophy, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { GlassCard } from './glass-card';

type WinnerCard = {
  position: 'TOP 1' | 'TOP 2';
  label: string;
  projectTitle: string;
  teamMembers: string[];
  description: string;
  year: string;
  posterUrl: string;
  accentColor: string;
};

// Lógica anterior por categorías/ingeniería (comentada para reutilización futura):
// const winnersDataByCategory = [
//   {
//     engineeringId: 1,
//     projectTitle: 'Sistema de Alerta de Deserción Estudiantil',
//     teamMembers: ['Esteban Ramírez', 'Jean Herrán', 'Juan Pineda'],
//     description: '...',
//     year: '2025-30',
//     posterUrl: '...',
//   },
//   // ... más proyectos por categoría
// ];

// TOP 1 y TOP 2 simples sin filtro:
const topWinnersData: WinnerCard[] = [
  {
    position: 'TOP 1',
    label: 'Primer ganador',
    projectTitle: 'Sistema de Alerta de Deserción Estudiantil',
    teamMembers: ['Esteban Ramírez', 'Jean Herrán', 'Juan Pineda'],
    description:
      'Este proyecto desarrolla un sistema de alerta temprana que predice el riesgo de deserción estudiantil mediante técnicas de Machine Learning. El sistema desplegado en producción genera alertas personalizadas y explica factores contribuyentes, permitiendo intervenciones preventivas por coordinadores académicos y bienestar institucional.',
    year: '2025-30',
    posterUrl:
      'https://irislab.blob.core.windows.net/irislabcontainer/1764015659802-Poster%20_SADE_Feria.png?sv=2025-11-05&se=2026-11-24T20%3A20%3A59Z&sr=b&sp=r&sig=vMMb3PKpGfoQo0MND4BJAHBFvV5DffN7lh3NughxDrA%3D',
    accentColor: 'oklch(0.75 0.15 195)',
  },
  {
    position: 'TOP 2',
    label: 'Segundo ganador',
    projectTitle: 'Gestión sostenible del riesgo climático',
    teamMembers: ['Dayana Torres', 'Luis Márquez'],
    description:
      'El proyecto evalúa la vulnerabilidad del arroyo de la calle 84 en Barranquilla para mejorar su resiliencia ante el cambio climático. Mediante QGIS, HEC-HMS y HEC-RAS se analiza su comportamiento hidrológico e hidráulico y se aplican enfoques de vulnerabilidad del IPCC y MOVE. Se busca reducir inundaciones, minimizar pérdidas económicas y fortalecer la seguridad pública conforme a los ODS y al POT.',
    year: '2025-30',
    posterUrl:
      'https://irislab.blob.core.windows.net/irislabcontainer/1764015710362-POSTER%20ENTREGA%20FINAL%20COMPLETO.pdf?sv=2025-11-05&se=2026-11-24T20%3A21%3A50Z&sr=b&sp=r&sig=WyO8x8R%2FIHMNIpJca0eZhwAcFHpf2kn9vhOMkFHhVdo%3D',
    accentColor: 'oklch(0.82 0.18 330)',
  },
];

interface WinnersTopSectionProps {
  winnersSectionRef: RefObject<HTMLElement>;
}

export function WinnersTopSection({ winnersSectionRef }: WinnersTopSectionProps) {
  return (
    <section
      id="ganadores"
      ref={winnersSectionRef}
      className="relative z-10 px-6 py-12 md:px-12 md:py-16"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center gap-2 glass-effect px-4 py-2 rounded-full text-sm text-primary mb-6">
            <Trophy className="w-4 h-4" />
            <span>Proyectos Destacados 2025-30</span>
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-none mb-4 text-balance">
            Proyectos <span className="prismatic-text">Ganadores</span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Descubre los dos proyectos más destacados del recorrido, organizados como TOP 1 y TOP 2.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6 items-stretch max-w-5xl mx-auto">
          {topWinnersData.map((winner) => (
            <GlassCard
              key={winner.position}
              className="overflow-hidden group hover:scale-[1.01] transition-all duration-700 h-full p-5 sm:p-6"
            >
              <div
                className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-700"
                style={{
                  background: `linear-gradient(135deg, ${winner.accentColor} 0%, transparent 70%)`,
                }}
              />

              <div className="relative z-10 flex h-full flex-col">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="flex-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3 text-xs font-semibold" style={{ background: `color-mix(in oklch, ${winner.accentColor}, transparent 85%)`, color: winner.accentColor }}>
                      <Star className="w-3.5 h-3.5" fill={winner.accentColor} />
                      {winner.position}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{winner.label} · {winner.year}</span>
                    </div>
                  </div>

                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                    style={{
                      background: `color-mix(in oklch, ${winner.accentColor}, transparent 82%)`,
                      boxShadow: `0 0 30px color-mix(in oklch, ${winner.accentColor}, transparent 55%)`,
                    }}
                  >
                    <Trophy className="w-6 h-6" style={{ color: winner.accentColor }} />
                  </div>
                </div>

                <h3 className="text-2xl sm:text-[1.75rem] font-bold mb-3 leading-tight text-balance group-hover:text-primary transition-colors">
                  {winner.projectTitle}
                </h3>

                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-5 line-clamp-4">
                  {winner.description}
                </p>

                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Equipo
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {winner.teamMembers.map((member) => (
                      <div
                        key={member}
                        className="px-3 py-2 rounded-lg glass-effect hover:glass-effect-strong transition-all duration-300"
                        style={{
                          border: `1px solid color-mix(in oklch, ${winner.accentColor}, transparent 82%)`,
                        }}
                      >
                        <span className="text-sm font-medium">{member}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-auto">
                  <Button
                    type="button"
                    onClick={() => window.open(winner.posterUrl, '_blank')}
                    className="w-full sm:w-auto group/btn transition-all duration-300"
                    style={{
                      background: 'rgba(18, 18, 28, 0.3)',
                      backdropFilter: 'blur(10px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(10px) saturate(180%)',
                      border: `2px solid ${winner.accentColor}`,
                      boxShadow: `0 0 20px color-mix(in oklch, ${winner.accentColor}, transparent 60%)`,
                      color: winner.accentColor,
                    }}
                  >
                    Ver póster
                    <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
