'use client';

import { Sparkles } from 'lucide-react';
import { RefObject } from 'react';
import { FloatingHeroShapes } from '@/components/layouts/floating-hero-shapes';
import { landingContent } from '../content';

interface HeroSectionProps {
  heroRef: RefObject<HTMLElement>;
  heroTextRef: RefObject<HTMLDivElement>;
  scrollIndicatorRef: RefObject<HTMLDivElement>;
}

export function HeroSection({
  heroRef,
  heroTextRef,
  scrollIndicatorRef,
}: HeroSectionProps) {
  return (
    <section
      ref={heroRef}
      className="relative z-10 min-h-screen flex items-center justify-center px-6 py-24 sm:py-28 md:py-32 overflow-hidden"
    >
      <FloatingHeroShapes className="absolute inset-0" interactive={true} />

      <div className="max-w-7xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 glass-effect px-4 py-2 rounded-full text-xs sm:text-sm text-primary mb-6 sm:mb-8">
          <Sparkles className="w-4 h-4" />
          <span>{landingContent.hero.badge}</span>
        </div>

        <div ref={heroTextRef} className="mb-6 sm:mb-8" style={{ perspective: '1000px' }}>
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-[10rem] font-black leading-none">
            {landingContent.hero.title.split('').map((letter, i) => (
              <span
                key={i}
                className="letter inline-block prismatic-text"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {letter}
              </span>
            ))}
          </h1>
        </div>

        <p className="text-base sm:text-xl md:text-2xl lg:text-3xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-10 sm:mb-12">
          {landingContent.hero.subtitle}
        </p>

        {/* 3D Card showcase instead of buttons */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 md:gap-8 mb-12 sm:mb-16 flex-wrap">
          {landingContent.hero.stats.map((stat, index) => (
            <div 
              key={index}
              className="glass-effect p-4 sm:p-5 md:p-6 rounded-2xl hover:scale-105 transition-all duration-300 group"
              style={{
                boxShadow: `0 8px 32px ${
                  index === 0 ? 'oklch(0.75 0.15 195 / 0.2)' :
                  index === 1 ? 'oklch(0.82 0.18 330 / 0.2)' :
                  'oklch(0.88 0.16 85 / 0.2)'
                }`,
                background: `color-mix(in oklch, ${
                  index === 0 ? 'oklch(0.75 0.15 195)' :
                  index === 1 ? 'oklch(0.82 0.18 330)' :
                  'oklch(0.88 0.16 85)'
                }, transparent 90%)`,
              }}
            >
              <div className={`text-2xl sm:text-3xl md:text-4xl font-black mb-2 ${
                index === 0 ? 'prismatic-text' :
                index === 1 ? 'text-secondary' :
                'text-accent'
              }`}>
                {stat.value}
              </div>
              <div className="text-sm sm:text-base md:text-lg text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>

        <div
          ref={scrollIndicatorRef}
          className="mt-10 text-sm text-muted-foreground animate-bounce"
        >
          <div className="flex flex-col items-center gap-2">
            <span>{landingContent.hero.scrollIndicator}</span>
            <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/80 flex items-start justify-center p-2">
              <div className="w-1 h-2 bg-muted-foreground rounded-full animate-scroll-down" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
