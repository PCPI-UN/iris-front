'use client';

import { RefObject, useEffect, useRef, useState } from 'react';
import { Rows3, Grid2x2 } from 'lucide-react';
import { landingContent } from '../content';

interface DevelopersCarouselProps {
  developersRef: RefObject<HTMLElement>;
}

type Developer = (typeof landingContent.developers.team)[number];

interface VersionCarouselProps {
  developers: Developer[];
  version: 'v1.0' | 'v2.0';
}

function VersionCarousel({ developers, version }: VersionCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isV2 = version === 'v2.0';

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || developers.length === 0) return;

    let animationFrameId: number;
    let scrollPosition = 0;
    const scrollSpeed = isV2 ? 0.55 : 0.5;

    const animate = () => {
      scrollPosition += scrollSpeed;

      if (scrollPosition >= scrollContainer.scrollWidth / 2) {
        scrollPosition = 0;
      }

      scrollContainer.scrollLeft = scrollPosition;
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [developers.length, isV2]);

  if (developers.length === 0) {
    return (
      <div className="rounded-xl border border-border/40 bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
        Aún no hay integrantes registrados para {version.toUpperCase()}.
      </div>
    );
  }

  const duplicatedDevelopers = [...developers, ...developers, ...developers];

  return (
    <div className="relative w-full overflow-hidden">
      <div
        ref={scrollRef}
        className="flex gap-8 md:gap-12 overflow-x-hidden py-8"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          maskImage: 'linear-gradient(to right, transparent 0%, black 30%, black 80%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 30%, black 80%, transparent 100%)',
        }}
      >
        {duplicatedDevelopers.map((dev, index) => (
          <div key={`${version}-${dev.name}-${index}`} className="flex-shrink-0 flex items-center">
            <div className="flex flex-col items-center text-center whitespace-nowrap px-2">
              <h3 className="text-sm md:text-base font-semibold text-foreground/95">{dev.name}</h3>
              <p className="mt-1 text-[11px] md:text-xs font-mono text-muted-foreground uppercase tracking-wider">
                {dev.role}
              </p>
              <span
                className={`mt-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] md:text-xs font-mono ${
                  isV2
                    ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                    : 'border-blue-500/40 bg-blue-500/15 text-blue-400'
                }`}
              >
                {dev.version}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface VersionColumnProps {
  developers: Developer[];
  version: 'v1.0' | 'v2.0';
}

function VersionColumn({ developers, version }: VersionColumnProps) {
  const isV2 = version === 'v2.0';

  if (developers.length === 0) {
    return (
      <div className="rounded-xl border border-border/40 bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
        Aún no hay integrantes registrados para {version.toUpperCase()}.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {developers.map((dev) => (
        <div
          key={`${version}-${dev.name}`}
          className={`rounded-lg border px-4 py-3 backdrop-blur-sm transition-all ${
            isV2
              ? 'border-emerald-500/35 bg-emerald-500/10'
              : 'border-blue-500/35 bg-blue-500/10'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm md:text-base font-semibold text-foreground/95">{dev.name}</h3>
            <span
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] md:text-xs font-mono ${
                isV2
                  ? 'border-emerald-500/45 bg-emerald-500/20 text-emerald-300'
                  : 'border-blue-500/45 bg-blue-500/20 text-blue-300'
              }`}
            >
              {dev.version}
            </span>
          </div>
          <p className="mt-1 text-[11px] md:text-xs font-mono text-muted-foreground uppercase tracking-wider">
            {dev.role}
          </p>
        </div>
      ))}
    </div>
  );
}

export function DevelopersCarousel({ developersRef }: DevelopersCarouselProps) {
  const [viewMode, setViewMode] = useState<'carousel' | 'list'>('carousel');
  const developers = landingContent.developers.team;
  const v1Developers = developers.filter((dev) => dev.version.toLowerCase().trim() === 'v1.0');
  const v2Developers = developers.filter((dev) => dev.version.toLowerCase().trim() === 'v2.0');

  return (
    <section
      id="developers"
      ref={developersRef}
      className="relative z-10 py-12 md:py-16 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 mb-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs text-muted-foreground border border-border/50 mb-3">
            <div className="w-0 h-1.5 rounded-full bg-primary/60 animate-pulse" />
            <span>{landingContent.developers.badge}</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-bold mb-2">
            {landingContent.developers.title} <span className="prismatic-text">{landingContent.developers.titleHighlight}</span>
          </h2>

          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => setViewMode((prev) => (prev === 'carousel' ? 'list' : 'carousel'))}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full cursor-pointer text-black transition-all duration-200 hover:scale-105 hover:brightness-110"
              style={{
                background:
                  'linear-gradient(135deg, oklch(0.75 0.15 195), oklch(0.82 0.18 330), oklch(0.88 0.16 85), oklch(0.75 0.15 195))',
              }}
              aria-label={viewMode === 'carousel' ? 'Cambiar a vista de lista' : 'Cambiar a vista de carrusel'}
              title={viewMode === 'carousel' ? 'Vista lista' : 'Vista carrusel'}
            >
              {viewMode === 'carousel' ? <Rows3 className="h-4 w-4 text-black" /> : <Grid2x2 className="h-4 w-4 text-black" />}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {viewMode === 'carousel' ? (
          <div className="space-y-6">
            <div>
              <div className="mb-3 text-xs md:text-sm font-mono text-blue-400/90 uppercase tracking-[0.2em]">
                Versión v1.0
              </div>
              <VersionCarousel developers={v1Developers} version="v1.0" />
            </div>

            <div>
              <div className="mb-3 text-xs md:text-sm font-mono text-emerald-400/90 uppercase tracking-[0.2em]">
                Versión v2.0
              </div>
              <VersionCarousel developers={v2Developers} version="v2.0" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-start">
            <div>
              <div className="mb-3 text-xs md:text-sm font-mono text-blue-400/90 uppercase tracking-[0.2em]">
                Versión v1.0
              </div>
              <VersionColumn developers={v1Developers} version="v1.0" />
            </div>

            <div>
              <div className="mb-3 text-xs md:text-sm font-mono text-emerald-400/90 uppercase tracking-[0.2em]">
                Versión v2.0
              </div>
              <VersionColumn developers={v2Developers} version="v2.0" />
            </div>
          </div>
        )}
      </div>

      {/* Bottom subtle line */}
      <div className="mt-8 max-w-3xl mx-auto px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" />
      </div>
    </section>
  );
}
