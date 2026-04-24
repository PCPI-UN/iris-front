// This component is responsible for displaying a carousel of developers on the landing page.
// It shows the latest version of the project and allows users to see the contributors associated with that version. 
'use client';

import { RefObject, useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { getContributorFullName } from '@/features/developers/data/contributors';
import { landingContent } from '../content';
import { paths } from '@/config/paths';
// Types and utility functions for handling developer versions and sorting
interface DevelopersCarouselProps {
  developersRef: RefObject<HTMLElement>;
}

type Developer = (typeof landingContent.developers.team)[number];

const normalizeVersion = (version: string) => version.trim().toLowerCase();

const getVersionParts = (version: string) => {
  const matches = normalizeVersion(version).match(/\d+/g);
  return matches ? matches.map(Number) : [0];
};

const compareVersions = (a: string, b: string) => {
  const aParts = getVersionParts(a);
  const bParts = getVersionParts(b);
  const length = Math.max(aParts.length, bParts.length);

  for (let i = 0; i < length; i += 1) {
    const aValue = aParts[i] ?? 0;
    const bValue = bParts[i] ?? 0;

    if (aValue > bValue) return 1;
    if (aValue < bValue) return -1;
  }

  return 0;
};
interface VersionCarouselProps {
  developers: Developer[];
  version: string;
}
// Function to display a horizontally scrolling carousel.
function VersionCarousel({ developers, version }: VersionCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const normalizedVersion = normalizeVersion(version);
  const isLatestStyle = normalizedVersion !== 'v1.0';

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || developers.length === 0) return;

    let animationFrameId: number;
    let scrollPosition = 0;
    const scrollSpeed = isLatestStyle ? 0.55 : 0.5;

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
  }, [developers.length, isLatestStyle]);

  if (developers.length === 0) {
    return (
      <div className="rounded-xl border border-border/40 bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
        Aún no hay integrantes registrados para {version.toUpperCase()}.
      </div>
    );
  }
// Seamless infinite scroll
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
          <div key={`${version}-${getContributorFullName(dev)}-${index}`} className="flex-shrink-0 flex items-center">
            <div className="flex flex-col items-center text-center whitespace-nowrap px-2">
              <h3 className="text-sm md:text-base font-semibold text-foreground/95">{`${dev.firstName} ${dev.lastName1}`.trim()}</h3>
              <p className="mt-1 text-[11px] md:text-xs font-mono text-muted-foreground uppercase tracking-wider">
                {dev.role}
              </p>
              <span
                className={`mt-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] md:text-xs font-mono ${
                  isLatestStyle
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
// Man component for the developers carousel section.
export function DevelopersCarousel({ developersRef }: DevelopersCarouselProps) {
  const developers = landingContent.developers.team;

  const versions = Array.from(new Set(developers.map((dev) => dev.version)));
  const latestVersion =
    versions.reduce((latest, current) => (compareVersions(current, latest) > 0 ? current : latest), versions[0]) ??
    'v1.0';
  const latestDevelopers = developers.filter(
    (dev) => normalizeVersion(dev.version) === normalizeVersion(latestVersion)
  );
  const PRIORITY_NAME = 'daniel romero';

const latestDevelopersOrdered = [...latestDevelopers].sort((a, b) => {
  const aIsPriority = getContributorFullName(a).trim().toLowerCase() === PRIORITY_NAME;
  const bIsPriority = getContributorFullName(b).trim().toLowerCase() === PRIORITY_NAME;

  if (aIsPriority && !bIsPriority) return -1;
  if (!aIsPriority && bIsPriority) return 1;
  return 0; // keep original order if neither is priority
});
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
            <Link
              href={paths.public.developers.getHref()}
              scroll={false}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full cursor-pointer text-black transition-all duration-200 hover:scale-105 hover:brightness-110"
              style={{
                background:
                  'linear-gradient(135deg, oklch(0.75 0.15 195), oklch(0.82 0.18 330), oklch(0.88 0.16 85), oklch(0.75 0.15 195))',
              }}
              aria-label="Ver más contribuidores"
              title="Ver más"
            >
              <Plus className="h-4 w-4 text-black" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div>
          <div className="mb-3 text-xs md:text-sm font-mono text-emerald-400/90 uppercase tracking-[0.2em]">
            Versión {latestVersion}
          </div>
          <VersionCarousel developers={latestDevelopersOrdered} version={latestVersion} />
        </div>
      </div>

      {/* Bottom subtle line */}
      <div className="mt-8 max-w-3xl mx-auto px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" />
      </div>
    </section>
  );
}
