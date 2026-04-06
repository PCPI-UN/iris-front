'use client';

import { MouseEvent, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { cn } from '@/utils/cn';
import styles from './floating-hero-shapes.module.css';

type FloatingHeroShapesProps = {
  className?: string;
  interactive?: boolean;
  hideOnMobile?: boolean;
};

export function FloatingHeroShapes({ className, interactive = false, hideOnMobile = false }: FloatingHeroShapesProps) {
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
      if (cubeRef.current) {
        gsap.fromTo(
          cubeRef.current,
          { opacity: 0, scale: 0, rotate: -180, x: 200, y: -200 },
          { opacity: 0.2, scale: 1, rotate: 0, x: 0, y: 0, duration: 1.5, ease: 'elastic.out(1, 0.5)', delay: 0.3 }
        );
      }

      if (sphereRef.current) {
        gsap.fromTo(
          sphereRef.current,
          { opacity: 0, scale: 0, x: -200, y: -100 },
          { opacity: 0.25, scale: 1, x: 0, y: 0, duration: 1.2, ease: 'back.out(1.7)', delay: 0.5 }
        );
      }

      if (pyramidRef.current) {
        gsap.fromTo(
          pyramidRef.current,
          { opacity: 0, scale: 0, rotate: 180, x: 150, y: 200 },
          { opacity: 0.3, scale: 1, rotate: 0, x: 0, y: 0, duration: 1.4, ease: 'power3.out', delay: 0.7 }
        );
      }

      if (wireframeRef.current) {
        gsap.fromTo(
          wireframeRef.current,
          { opacity: 0, scale: 0, rotate: -90, x: -100, y: 150 },
          { opacity: 0.15, scale: 1, rotate: 0, x: 0, y: 0, duration: 1.6, ease: 'power2.out', delay: 0.9 }
        );
      }

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
          }
        );
      }

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
            onComplete: () => dot1Ref.current?.classList.add('animate-pulse'),
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
            onComplete: () => dot2Ref.current?.classList.add('animate-pulse'),
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
            onComplete: () => dot3Ref.current?.classList.add('animate-pulse'),
          }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  const cubeInteractive = interactive
    ? {
        onMouseEnter: (event: MouseEvent<HTMLDivElement>) => {
          event.currentTarget.style.boxShadow =
            '0 20px 80px oklch(0.75 0.15 195 / 0.8), 0 0 60px oklch(0.75 0.15 195 / 0.6)';
        },
        onMouseLeave: (event: MouseEvent<HTMLDivElement>) => {
          event.currentTarget.style.boxShadow = '0 20px 60px oklch(0.75 0.15 195 / 0.4)';
        },
      }
    : {};

  const sphereInteractive = interactive
    ? {
        onMouseEnter: (event: MouseEvent<HTMLDivElement>) => {
          event.currentTarget.style.boxShadow =
            '0 15px 60px oklch(0.82 0.18 330 / 0.8), 0 0 50px oklch(0.82 0.18 330 / 0.7)';
          event.currentTarget.style.filter = 'blur(0.5px)';
        },
        onMouseLeave: (event: MouseEvent<HTMLDivElement>) => {
          event.currentTarget.style.boxShadow = '0 15px 45px oklch(0.82 0.18 330 / 0.5)';
          event.currentTarget.style.filter = 'blur(1px)';
        },
      }
    : {};

  const pyramidInteractive = interactive
    ? {
        onMouseEnter: (event: MouseEvent<HTMLDivElement>) => {
          event.currentTarget.style.filter =
            'drop-shadow(0 10px 50px oklch(0.88 0.16 85 / 0.9)) drop-shadow(0 0 30px oklch(0.88 0.16 85 / 0.8))';
        },
        onMouseLeave: (event: MouseEvent<HTMLDivElement>) => {
          event.currentTarget.style.filter = 'drop-shadow(0 10px 30px oklch(0.88 0.16 85 / 0.6))';
        },
      }
    : {};

  const wireframeInteractive = interactive
    ? {
        onMouseEnter: (event: MouseEvent<HTMLDivElement>) => {
          event.currentTarget.style.borderColor = 'oklch(0.85 0.2 195)';
          event.currentTarget.style.boxShadow =
            '0 0 40px oklch(0.75 0.15 195 / 0.8), inset 0 0 20px oklch(0.75 0.15 195 / 0.5)';
        },
        onMouseLeave: (event: MouseEvent<HTMLDivElement>) => {
          event.currentTarget.style.borderColor = 'oklch(0.75 0.15 195)';
          event.currentTarget.style.boxShadow = 'none';
        },
      }
    : {};

  const diamondInteractive = interactive
    ? {
        onMouseEnter: (event: MouseEvent<HTMLDivElement>) => {
          event.currentTarget.style.boxShadow =
            '0 0 60px oklch(0.75 0.15 195 / 0.9), 0 0 40px oklch(0.82 0.18 330 / 0.7), inset 0 0 30px oklch(0.88 0.16 85 / 0.5)';
          event.currentTarget.style.filter = 'blur(0px)';
        },
        onMouseLeave: (event: MouseEvent<HTMLDivElement>) => {
          event.currentTarget.style.boxShadow =
            '0 0 40px oklch(0.75 0.15 195 / 0.6), inset 0 0 20px oklch(0.82 0.18 330 / 0.3)';
          event.currentTarget.style.filter = 'blur(0.5px)';
        },
      }
    : {};

  const dot1Interactive = interactive
    ? {
        onMouseEnter: (event: MouseEvent<HTMLDivElement>) => {
          event.currentTarget.style.boxShadow =
            '0 0 40px oklch(0.75 0.15 195), 0 0 20px oklch(0.75 0.15 195)';
        },
        onMouseLeave: (event: MouseEvent<HTMLDivElement>) => {
          event.currentTarget.style.boxShadow = '0 0 20px oklch(0.75 0.15 195)';
        },
      }
    : {};

  const dot2Interactive = interactive
    ? {
        onMouseEnter: (event: MouseEvent<HTMLDivElement>) => {
          event.currentTarget.style.boxShadow =
            '0 0 35px oklch(0.82 0.18 330), 0 0 18px oklch(0.82 0.18 330)';
        },
        onMouseLeave: (event: MouseEvent<HTMLDivElement>) => {
          event.currentTarget.style.boxShadow = '0 0 15px oklch(0.82 0.18 330)';
        },
      }
    : {};

  const dot3Interactive = interactive
    ? {
        onMouseEnter: (event: MouseEvent<HTMLDivElement>) => {
          event.currentTarget.style.boxShadow =
            '0 0 30px oklch(0.88 0.16 85), 0 0 15px oklch(0.88 0.16 85)';
        },
        onMouseLeave: (event: MouseEvent<HTMLDivElement>) => {
          event.currentTarget.style.boxShadow = '0 0 10px oklch(0.88 0.16 85)';
        },
      }
    : {};

  return (
    <div className={cn(hideOnMobile && 'hidden md:block', className)}>
      <div
        ref={cubeRef}
        className={cn(
          styles.shape,
          styles.floatSlow,
          'absolute top-12 right-[4%] sm:top-16 sm:right-[7%] md:top-20 md:right-[10%] w-14 h-14 sm:w-20 sm:h-20 md:w-48 md:h-48 lg:w-64 lg:h-64 opacity-15 sm:opacity-20 transition-all duration-500',
          interactive && 'cursor-pointer hover:opacity-40 hover:scale-110'
        )}
        style={{
          background: 'linear-gradient(135deg, oklch(0.75 0.15 195 / 0.3), oklch(0.82 0.18 330 / 0.3))',
          transform: 'rotateX(45deg) rotateY(45deg)',
          borderRadius: '20px',
          boxShadow: '0 20px 60px oklch(0.75 0.15 195 / 0.4)',
        }}
        {...cubeInteractive}
      />

      <div
        ref={sphereRef}
        className={cn(
          styles.shape,
          styles.floatMedium,
          'absolute top-24 left-[6%] sm:top-32 sm:left-[12%] md:top-40 md:left-[15%] w-12 h-12 sm:w-20 sm:h-20 md:w-36 md:h-36 lg:w-48 lg:h-48 rounded-full opacity-15 sm:opacity-25 transition-all duration-500',
          interactive && 'cursor-pointer hover:opacity-45 hover:scale-110'
        )}
        style={{
          background: 'radial-gradient(circle at 30% 30%, oklch(0.82 0.18 330 / 0.4), oklch(0.88 0.16 85 / 0.2))',
          boxShadow: '0 15px 45px oklch(0.82 0.18 330 / 0.5)',
          filter: 'blur(1px)',
        }}
        {...sphereInteractive}
      />

      <div
        ref={pyramidRef}
        className={cn(
          styles.shape,
          styles.floatFast,
          'absolute bottom-24 right-[6%] sm:bottom-28 sm:right-[14%] md:bottom-32 md:right-[20%] w-10 h-10 sm:w-14 sm:h-14 md:w-24 md:h-24 lg:w-32 lg:h-32 opacity-20 sm:opacity-30 transition-all duration-500',
          interactive && 'cursor-pointer hover:opacity-50 hover:scale-110'
        )}
        style={{
          background: 'linear-gradient(to bottom right, oklch(0.88 0.16 85 / 0.4), transparent)',
          clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
          filter: 'drop-shadow(0 10px 30px oklch(0.88 0.16 85 / 0.6))',
        }}
        {...pyramidInteractive}
      />

      <div
        ref={wireframeRef}
        className={cn(
          styles.shape,
          styles.rotateSlow,
          'absolute bottom-28 left-[4%] sm:bottom-32 sm:left-[6%] md:bottom-40 md:left-[8%] w-12 h-12 sm:w-20 sm:h-20 md:w-32 md:h-32 lg:w-40 lg:h-40 opacity-10 sm:opacity-15 transition-all duration-500',
          interactive && 'cursor-pointer hover:opacity-35 hover:scale-110'
        )}
        style={{
          border: '2px solid oklch(0.75 0.15 195)',
          transform: 'rotateX(30deg) rotateZ(45deg)',
          transformStyle: 'preserve-3d',
        }}
        {...wireframeInteractive}
      />

      <div
        ref={diamondRef}
        className={cn(
          styles.shape,
          styles.floatMedium,
          'absolute top-[18%] right-[18%] sm:top-[22%] sm:right-[28%] md:top-[25%] md:right-[35%] w-10 h-12 sm:w-14 sm:h-16 md:w-20 md:h-24 lg:w-24 lg:h-28 opacity-15 sm:opacity-25 transition-all duration-500',
          interactive && 'cursor-pointer hover:opacity-45 hover:scale-110'
        )}
        style={{
          background: 'linear-gradient(120deg, oklch(0.75 0.15 195 / 0.5), oklch(0.82 0.18 330 / 0.3), oklch(0.88 0.16 85 / 0.2))',
          clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
          boxShadow: '0 0 40px oklch(0.75 0.15 195 / 0.6), inset 0 0 20px oklch(0.82 0.18 330 / 0.3)',
          filter: 'blur(0.5px)',
        }}
        {...diamondInteractive}
      />

      <div
        ref={dot1Ref}
        className={cn(
          'absolute top-[34%] left-[18%] sm:top-[30%] sm:left-[22%] md:top-[30%] md:left-[25%] w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 rounded-full bg-primary/60 transition-all duration-300',
          interactive && 'cursor-pointer hover:scale-150 hover:bg-primary/90'
        )}
        style={{ boxShadow: '0 0 20px oklch(0.75 0.15 195)' }}
        {...dot1Interactive}
      />

      <div
        ref={dot2Ref}
        className={cn(
          'absolute top-[64%] right-[18%] sm:top-[62%] sm:right-[24%] md:top-[60%] md:right-[30%] w-1 h-1 sm:w-2 sm:h-2 md:w-3 md:h-3 rounded-full bg-secondary/60 transition-all duration-300',
          interactive && 'cursor-pointer hover:scale-150 hover:bg-secondary/90'
        )}
        style={{ boxShadow: '0 0 15px oklch(0.82 0.18 330)' }}
        {...dot2Interactive}
      />

      <div
        ref={dot3Ref}
        className={cn(
          'absolute top-[50%] left-[34%] sm:top-[48%] sm:left-[37%] md:top-[45%] md:left-[40%] w-1 h-1 sm:w-1.5 sm:h-1.5 md:w-2 md:h-2 rounded-full bg-accent/60 transition-all duration-300',
          interactive && 'cursor-pointer hover:scale-150 hover:bg-accent/90'
        )}
        style={{ boxShadow: '0 0 10px oklch(0.88 0.16 85)' }}
        {...dot3Interactive}
      />
    </div>
  );
}
