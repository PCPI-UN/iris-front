'use client';

import { Sparkles } from 'lucide-react';
import { RefObject, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { landingContent } from '../content';
import gsap from 'gsap';

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
  // Refs for floating elements
  const cubeRef = useRef<HTMLDivElement>(null);
  const sphereRef = useRef<HTMLDivElement>(null);
  const pyramidRef = useRef<HTMLDivElement>(null);
  const wireframeRef = useRef<HTMLDivElement>(null);
  const diamondRef = useRef<HTMLDivElement>(null);
  const dot1Ref = useRef<HTMLDivElement>(null);
  const dot2Ref = useRef<HTMLDivElement>(null);
  const dot3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate cube entrance
      if (cubeRef.current) {
        gsap.fromTo(
          cubeRef.current,
          { opacity: 0, scale: 0, rotate: -180, x: 200, y: -200 },
          { opacity: 0.2, scale: 1, rotate: 0, x: 0, y: 0, duration: 1.5, ease: 'elastic.out(1, 0.5)', delay: 0.3 }
        );
      }

      // Animate sphere entrance
      if (sphereRef.current) {
        gsap.fromTo(
          sphereRef.current,
          { opacity: 0, scale: 0, x: -200, y: -100 },
          { opacity: 0.25, scale: 1, x: 0, y: 0, duration: 1.2, ease: 'back.out(1.7)', delay: 0.5 }
        );
      }

      // Animate pyramid entrance
      if (pyramidRef.current) {
        gsap.fromTo(
          pyramidRef.current,
          { opacity: 0, scale: 0, rotate: 180, x: 150, y: 200 },
          { opacity: 0.3, scale: 1, rotate: 0, x: 0, y: 0, duration: 1.4, ease: 'power3.out', delay: 0.7 }
        );
      }

      // Animate wireframe entrance
      if (wireframeRef.current) {
        gsap.fromTo(
          wireframeRef.current,
          { opacity: 0, scale: 0, rotate: -90, x: -100, y: 150 },
          { opacity: 0.15, scale: 1, rotate: 0, x: 0, y: 0, duration: 1.6, ease: 'power2.out', delay: 0.9 }
        );
      }

      // Animate diamond entrance
      if (diamondRef.current) {
        gsap.fromTo(
          diamondRef.current,
          { opacity: 0, scale: 0, y: -150 },
          { 
            opacity: 0.25, 
            scale: 1, 
            y: 0, 
            duration: 1.3, 
            ease: 'elastic.out(1, 0.6)', 
            delay: 0.3,
            onComplete: () => {
              // Activar la animación CSS solo después de que termine la entrada
              if (diamondRef.current) {
                diamondRef.current.style.animation = 'float-medium 9s ease-in-out infinite';
                diamondRef.current.style.animationDelay = '2s';
              }
            }
          }
        );
      }

      // Animate dots with stagger - individually
      if (dot1Ref.current) {
        gsap.fromTo(
          dot1Ref.current,
          { opacity: 0, scale: 0 },
          { 
            opacity: 0.6, 
            scale: 1, 
            duration: 0.8, 
            ease: 'back.out(2)', 
            delay: 0.3,
            onComplete: () => {
              if (dot1Ref.current) {
                dot1Ref.current.classList.add('animate-pulse');
              }
            }
          }
        );
      }

      if (dot2Ref.current) {
        gsap.fromTo(
          dot2Ref.current,
          { opacity: 0, scale: 0 },
          { 
            opacity: 0.6, 
            scale: 1, 
            duration: 0.8, 
            ease: 'back.out(2)', 
            delay: 1.45,
            onComplete: () => {
              if (dot2Ref.current) {
                dot2Ref.current.classList.add('animate-pulse');
              }
            }
          }
        );
      }

      if (dot3Ref.current) {
        gsap.fromTo(
          dot3Ref.current,
          { opacity: 0, scale: 0 },
          { 
            opacity: 0.6, 
            scale: 1, 
            duration: 0.8, 
            ease: 'back.out(2)', 
            delay: 1.6,
            onComplete: () => {
              if (dot3Ref.current) {
                dot3Ref.current.classList.add('animate-pulse');
              }
            }
          }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative z-10 min-h-screen flex items-center justify-center px-6 py-24 sm:py-28 md:py-32 overflow-hidden"
    >
      {/* Floating 3D Elements Background */}
      <div className="absolute inset-0 hidden md:block">
        {/* Large floating cube */}
        <div 
          ref={cubeRef}
          className="absolute top-20 right-[10%] w-32 h-32 md:w-48 md:h-48 lg:w-64 lg:h-64 opacity-20 cursor-pointer transition-all duration-500 hover:opacity-40 hover:scale-110"
          style={{
            background: 'linear-gradient(135deg, oklch(0.75 0.15 195 / 0.3), oklch(0.82 0.18 330 / 0.3))',
            transform: 'rotateX(45deg) rotateY(45deg)',
            animation: 'float-slow 12s ease-in-out infinite',
            borderRadius: '20px',
            boxShadow: '0 20px 60px oklch(0.75 0.15 195 / 0.4)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 20px 80px oklch(0.75 0.15 195 / 0.8), 0 0 60px oklch(0.75 0.15 195 / 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 20px 60px oklch(0.75 0.15 195 / 0.4)';
          }}
        />
        
        {/* Medium floating sphere */}
        <div 
          ref={sphereRef}
          className="absolute top-40 left-[15%] w-28 h-28 md:w-36 md:h-36 lg:w-48 lg:h-48 rounded-full opacity-25 cursor-pointer transition-all duration-500 hover:opacity-45 hover:scale-110"
          style={{
            background: 'radial-gradient(circle at 30% 30%, oklch(0.82 0.18 330 / 0.4), oklch(0.88 0.16 85 / 0.2))',
            animation: 'float-medium 10s ease-in-out infinite',
            boxShadow: '0 15px 45px oklch(0.82 0.18 330 / 0.5)',
            filter: 'blur(1px)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 15px 60px oklch(0.82 0.18 330 / 0.8), 0 0 50px oklch(0.82 0.18 330 / 0.7)';
            e.currentTarget.style.filter = 'blur(0.5px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 15px 45px oklch(0.82 0.18 330 / 0.5)';
            e.currentTarget.style.filter = 'blur(1px)';
          }}
        />
        
        {/* Small floating pyramid */}
        <div 
          ref={pyramidRef}
          className="absolute bottom-32 right-[20%] w-20 h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 opacity-30 cursor-pointer transition-all duration-500 hover:opacity-50 hover:scale-110"
          style={{
            background: 'linear-gradient(to bottom right, oklch(0.88 0.16 85 / 0.4), transparent)',
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
            animation: 'float-fast 8s ease-in-out infinite',
            filter: 'drop-shadow(0 10px 30px oklch(0.88 0.16 85 / 0.6))',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.filter = 'drop-shadow(0 10px 50px oklch(0.88 0.16 85 / 0.9)) drop-shadow(0 0 30px oklch(0.88 0.16 85 / 0.8))';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = 'drop-shadow(0 10px 30px oklch(0.88 0.16 85 / 0.6))';
          }}
        />

        {/* Wireframe cube */}
        <div 
          ref={wireframeRef}
          className="absolute bottom-40 left-[8%] w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 opacity-15 cursor-pointer transition-all duration-500 hover:opacity-35 hover:scale-110"
          style={{
            border: '2px solid oklch(0.75 0.15 195)',
            transform: 'rotateX(30deg) rotateZ(45deg)',
            animation: 'rotate-slow 25s ease-in-out infinite',
            transformStyle: 'preserve-3d',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'oklch(0.85 0.2 195)';
            e.currentTarget.style.boxShadow = '0 0 40px oklch(0.75 0.15 195 / 0.8), inset 0 0 20px oklch(0.75 0.15 195 / 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'oklch(0.75 0.15 195)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />

        {/* Floating hexagon with gradient */}
        <div 
          ref={diamondRef}
          className="absolute top-[25%] right-[35%] w-16 h-20 md:w-20 md:h-24 lg:w-24 lg:h-28 opacity-25 cursor-pointer transition-all duration-500 hover:opacity-45 hover:scale-110"
          style={{
            background: 'linear-gradient(120deg, oklch(0.75 0.15 195 / 0.5), oklch(0.82 0.18 330 / 0.3), oklch(0.88 0.16 85 / 0.2))',
            clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
            boxShadow: '0 0 40px oklch(0.75 0.15 195 / 0.6), inset 0 0 20px oklch(0.82 0.18 330 / 0.3)',
            filter: 'blur(0.5px)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 0 60px oklch(0.75 0.15 195 / 0.9), 0 0 40px oklch(0.82 0.18 330 / 0.7), inset 0 0 30px oklch(0.88 0.16 85 / 0.5)';
            e.currentTarget.style.filter = 'blur(0px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 0 40px oklch(0.75 0.15 195 / 0.6), inset 0 0 20px oklch(0.82 0.18 330 / 0.3)';
            e.currentTarget.style.filter = 'blur(0.5px)';
          }}
        />

        {/* Small glowing dots with levitation */}
        <div 
          ref={dot1Ref}
          className="absolute top-[30%] left-[25%] w-4 h-4 rounded-full bg-primary/60 cursor-pointer transition-all duration-300 hover:scale-150 hover:bg-primary/90" 
          style={{ 
            boxShadow: '0 0 20px oklch(0.75 0.15 195)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 0 40px oklch(0.75 0.15 195), 0 0 20px oklch(0.75 0.15 195)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 0 20px oklch(0.75 0.15 195)';
          }}
        />
        <div 
          ref={dot2Ref}
          className="absolute top-[60%] right-[30%] w-3 h-3 rounded-full bg-secondary/60 cursor-pointer transition-all duration-300 hover:scale-150 hover:bg-secondary/90" 
          style={{ 
            boxShadow: '0 0 15px oklch(0.82 0.18 330)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 0 35px oklch(0.82 0.18 330), 0 0 18px oklch(0.82 0.18 330)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 0 15px oklch(0.82 0.18 330)';
          }}
        />
        <div 
          ref={dot3Ref}
          className="absolute top-[45%] left-[40%] w-2 h-2 rounded-full bg-accent/60 cursor-pointer transition-all duration-300 hover:scale-150 hover:bg-accent/90" 
          style={{ 
            boxShadow: '0 0 10px oklch(0.88 0.16 85)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 0 30px oklch(0.88 0.16 85), 0 0 15px oklch(0.88 0.16 85)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 0 10px oklch(0.88 0.16 85)';
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 glass-effect px-4 py-2 rounded-full text-xs sm:text-sm text-primary mb-6 sm:mb-8">
          <Sparkles className="w-4 h-4" />
          <span>{landingContent.hero.badge}</span>
        </div>

        <div ref={heroTextRef} className="mb-6 sm:mb-8" style={{ perspective: '1000px' }}>
          <h1 className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl xl:text-[12rem] font-black leading-none">
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
