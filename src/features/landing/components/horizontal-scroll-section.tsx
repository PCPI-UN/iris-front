'use client';

import { RefObject } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { landingContent } from '../content';
import { PastEventsSection } from './past-events-section';

interface HorizontalScrollSectionProps {
  horizontalSectionRef: RefObject<HTMLElement>;
  horizontalContentRef: RefObject<HTMLDivElement>;
}

export function HorizontalScrollSection({
  horizontalSectionRef,
  horizontalContentRef,
}: HorizontalScrollSectionProps) {
  const { panels } = landingContent.horizontalScroll;

  return (
    <section
      id="informacion"
      ref={horizontalSectionRef}

      className="relative z-10 mt-0 h-screen overflow-hidden bg-background sm:mt-8 md:mt-10"
    >
      <div ref={horizontalContentRef} className="flex h-full bg-background">
        {/* Panel 1 - Vision */}
<div className="horizontal-panel min-w-full h-full flex items-center justify-center px-6 sm:px-8 md:px-12">
  <div className="max-w-4xl w-full text-center -translate-y-8 md:-translate-y-12">
    <div className="mb-6 inline-flex text-primary font-mono text-sm">{panels[0].badge}</div>
    <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-6 sm:mb-8 leading-none">

              {panels[0].title}
              <br />
              {panels[0].titleLine2} <span className="prismatic-text">{panels[0].titleHighlight}</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              {panels[0].description}
            </p>
          </div>
        </div>

        {/* Panel 2 - Formation */}
        <div className="horizontal-panel min-w-full h-full flex items-center justify-center px-6 sm:px-8 md:px-12 bg-gradient-to-br from-primary/5 to-transparent">
          <div className="max-w-4xl w-full text-center">
            <div className="mb-6 inline-flex text-secondary font-mono text-sm">{panels[1].badge}</div>
            <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-6 sm:mb-8 leading-none">
              {panels[1].title}
              <br />
              <span className="prismatic-text">{panels[1].titleHighlight}</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-4xl mx-auto mb-8">
              {panels[1].description}
            </p>
          </div>
        </div>

        {/* Panel 3 - Recorrido */}
        <div className="horizontal-panel min-w-full h-full flex items-center justify-center px-6 sm:px-8 md:px-12 overflow-y-auto">
          <div className="max-w-4xl w-full py-8 sm:py-12">
            <div className="text-center mb-10 sm:mb-12 md:mb-14">
              <div className="mb-6 inline-flex items-center gap-2 glass-effect px-4 py-2 rounded-full text-sm text-primary">
                <span className="font-semibold">{panels[2].badge}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-6 sm:mb-8 leading-tight text-balance">
                <span className="prismatic-text">{panels[2].title}</span>
                <span className="text-white"> {panels[2].titleHighlight}</span>
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                {panels[2].description}
              </p>
            </div>
            <PastEventsSection />
          </div>
        </div>
      </div>
    </section>
  );
}
