'use client';

import { RefObject } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { landingContent } from '../content';

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
      className="relative z-10 mt-6 sm:mt-8 md:mt-10 h-screen overflow-hidden"
    >
      <div ref={horizontalContentRef} className="flex h-full">
        {/* Panel 1 - Vision */}
        <div className="horizontal-panel min-w-full h-full flex items-center justify-center px-6 sm:px-8 md:px-12">
          <div className="max-w-4xl w-full text-center">
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
        <div className="horizontal-panel min-w-full h-full flex items-center justify-center px-6 sm:px-8 md:px-12">
          <div className="max-w-4xl w-full text-center">
            <div className="mb-6 inline-flex text-accent font-mono text-sm">{panels[2].badge}</div>
            <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-6 sm:mb-8 leading-none">
              {panels[2].title}
              <span className="prismatic-text">{panels[2].titleHighlight}</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-4xl mx-auto mb-8">
              {panels[2].description}
            </p>
            {panels[2].cta && (
              <a
                href="https://www.uninorte.edu.co/web/ingenierias/proyectos-fin-de-carrera"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex"
              >
                <Button
                  size="lg"
                  className="group w-full sm:w-auto"
                  style={{ 
                    background: 'oklch(0.75 0.15 195)',
                    color: 'oklch(0.12 0.01 264)'
                  }}
                >
                  {panels[2].cta}
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
