'use client';

import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FloatingHeroShapes } from '@/components/layouts/floating-hero-shapes';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function DevelopersBackground() {
  const rootRef = useRef<HTMLDivElement>(null);
  const gradientRef = useRef<HTMLDivElement>(null);
  const shapesRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!rootRef.current || !shapesRef.current) return;

    const ctx = gsap.context(() => {
      const grid = document.getElementById('contributors-grid');

      if (grid) {
        gsap.to(shapesRef.current, {
          autoAlpha: 0,
          y: -80,
          ease: 'none',
          scrollTrigger: {
            trigger: grid,
            start: 'top 90%',
            end: 'top 45%',
            scrub: true,
          },
        });
      }

      if (gradientRef.current) {
        gsap.to(gradientRef.current, {
          y: -150,
          ease: 'none',
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
          },
        });
      }
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef} className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div
        ref={gradientRef}
        className="absolute top-0 left-0 w-[150%] h-[150%]"
        style={{
          background: `
            radial-gradient(circle at 20% 20%, oklch(0.75 0.15 195 / 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, oklch(0.82 0.18 330 / 0.15) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, oklch(0.88 0.16 85 / 0.1) 0%, transparent 50%)
          `,
        }}
      />

      <div ref={shapesRef} className="absolute inset-0">
        <FloatingHeroShapes className="absolute inset-0" interactive={false} />
      </div>
    </div>
  );
}