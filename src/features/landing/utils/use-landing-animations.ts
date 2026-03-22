'use client';

import { useEffect, RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function useLandingAnimations(
  refs: {
    heroTextRef: RefObject<HTMLDivElement>;
    storySection1Ref: RefObject<HTMLElement>;
    storySection2Ref: RefObject<HTMLElement>;
    storySection3Ref: RefObject<HTMLElement>;
    zoomTextRef: RefObject<HTMLDivElement>;
    layeredTextRef: RefObject<HTMLDivElement>;
    revealSectionRef: RefObject<HTMLElement>;
    horizontalSectionRef: RefObject<HTMLElement>;
    horizontalContentRef: RefObject<HTMLDivElement>;
    maskTextRef: RefObject<HTMLHeadingElement>;
    engineeringSectionRef: RefObject<HTMLElement>;
    eventsSectionRef: RefObject<HTMLElement>;
    heroRef: RefObject<HTMLElement>;
    scrollIndicatorRef: RefObject<HTMLDivElement>;
  }
) {
  useEffect(() => {
    // Kill all existing ScrollTriggers to prevent duplicates
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    
    const ctx = gsap.context(() => {
      // Hero text reveal with split effect
      if (refs.heroTextRef.current) {
        const letters = refs.heroTextRef.current.querySelectorAll('.letter');
        gsap.fromTo(
          letters,
          {
            opacity: 0,
            y: 100,
            rotateX: -90,
            scale: 0.5,
          },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            scale: 1,
            duration: 1.5,
            stagger: 0.03,
            ease: 'power4.out',
            delay: 0.5,
          }
        );
      }

      // STORYTELLING ANIMATIONS

      // Story Section 1 - Text layers that fade in/out
      if (refs.storySection1Ref.current) {
        const layers = refs.storySection1Ref.current.querySelectorAll('.text-layer');

        layers.forEach((layer) => {
          // Unified timeline for smooth fade in and out
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: layer,
              start: 'top 90%',
              end: 'bottom 30%',
              scrub: 1,
            },
          });

          tl.fromTo(
            layer,
            {
              opacity: 0,
              scale: 0.8,
              y: 100,
            },
            {
              opacity: 1,
              scale: 1,
              y: 0,
              ease: 'power3.out',
            }
          ).to(layer, {
            opacity: 0,
            scale: 1.2,
            y: -100,
            ease: 'power3.in',
          });
        });
      }

      // Story Section 2 - Zoom in effect
      if (refs.storySection2Ref.current) {
        const zoomElement = refs.storySection2Ref.current.querySelector('.zoom-container');

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: refs.storySection2Ref.current,
            start: 'top top',
            end: '+=100%',
            scrub: 1,
            pin: true,
            pinSpacing: true,
          },
        });

        tl.fromTo(
          zoomElement,
          {
            scale: 0.5,
            opacity: 0,
          },
          {
            scale: 1,
            opacity: 1,
            ease: 'power2.out',
          }
        ).to(zoomElement, {
          scale: 1.5,
          opacity: 0,
          ease: 'power2.in',
        });
      }

      // Story Section 3 - Layered text reveal
      if (refs.layeredTextRef.current) {
        const textLines = refs.layeredTextRef.current.querySelectorAll('.reveal-line');

        textLines.forEach((line, index) => {
          gsap.fromTo(
            line,
            {
              opacity: 0,
              x: index % 2 === 0 ? -200 : 200,
              rotateY: index % 2 === 0 ? -45 : 45,
            },
            {
              opacity: 1,
              x: 0,
              rotateY: 0,
              duration: 1.0,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: line,
                start: 'top 50%',
                toggleActions: 'play none none reverse',
              },
            }
          );
        });
      }

      // Zoom Text Section - Scale up dramatically
      if (refs.zoomTextRef.current) {
        gsap.fromTo(
          refs.zoomTextRef.current,
          {
            scale: 0.1,
            opacity: 0,
            rotation: -45,
          },
          {
            scale: 1,
            opacity: 1,
            rotation: 0,
            ease: 'power4.out',
            scrollTrigger: {
              trigger: refs.zoomTextRef.current,
              start: 'top bottom',
              end: 'center center',
              scrub: 1.5,
            },
          }
        );
      }

      // Reveal Section - Content that slides up to reveal next
      if (refs.revealSectionRef.current) {
        const panels = refs.revealSectionRef.current.querySelectorAll('.reveal-panel');

        panels.forEach((panel) => {
          gsap.fromTo(
            panel,
            {
              opacity: 0,
              y: 100,
            },
            {
              opacity: 1,
              y: 0,
              duration: 2,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: panel,
                start: 'top 90%',
                end: 'top 20%',
                toggleActions: 'play none none reverse',
                scrub: 2,
              },
            }
          );
        });
      }

      // Story Section 3 - Word by word reveal
      if (refs.storySection3Ref.current) {
        const words = refs.storySection3Ref.current.querySelectorAll('.story-word');

        gsap.fromTo(
          words,
          {
            opacity: 0,
            y: 50,
            rotateX: -90,
            scale: 0.5,
          },
          {
            opacity: 1,
            y: 0,
            rotateX: 0,
            scale: 1,
            duration: 0.9,
            stagger: 0.05,
            ease: 'back.out(1.7)',
            scrollTrigger: {
              trigger: refs.storySection3Ref.current,
              start: 'top 30%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

     // Horizontal scroll section inspired by Tech Redux
      if (refs.horizontalSectionRef.current && refs.horizontalContentRef.current) {
        const horizontalSection = refs.horizontalSectionRef.current;
        const horizontalContent = refs.horizontalContentRef.current;
        const panels = Array.from(
          horizontalContent.querySelectorAll<HTMLElement>('.horizontal-panel')
        );

        const getHorizontalDistance = () =>
          Math.max((horizontalContent.scrollWidth - horizontalSection.clientWidth), 0);

        gsap.set(horizontalContent, {
          x: 0,
          force3D: false,
          willChange: 'transform',
        });

        gsap.set(panels, {
          backfaceVisibility: 'hidden',
        });

        gsap.to(horizontalContent, {
          x: () => -getHorizontalDistance(),
          ease: 'none',
          autoRound: true,
          scrollTrigger: {
            trigger: horizontalSection,
            start: 'top top',
            pin: true, 
            pinSpacing: true,
            pinType: 'fixed',
            pinReparent: false,
            scrub: true,
            end: () => '+=' + getHorizontalDistance() * 0.6,
            anticipatePin: 0,
            invalidateOnRefresh: false,
            fastScrollEnd: false,
            refreshPriority: 1,
            onRefresh: (self) => {
              const distance = getHorizontalDistance();
              gsap.set(horizontalContent, { x: -distance * self.progress });
            },
          },
        });
      }

      // Mask text reveal effect inspired by Jextures
      if (refs.maskTextRef.current) {
        gsap.fromTo(
          refs.maskTextRef.current,
          {
            clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)',
          },
          {
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
            duration: 2,
            ease: 'power4.out',
            scrollTrigger: {
              trigger: refs.maskTextRef.current,
              start: 'top 70%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      // Engineering cards stagger animation
      if (refs.engineeringSectionRef.current) {
        const cards = refs.engineeringSectionRef.current.querySelectorAll('.engineering-card');

        gsap.fromTo(
          cards,
          {
            opacity: 0,
            scale: 0.8,
            y: 100,
          },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 1.2,
            stagger: 0.15,
            ease: 'back.out(1.4)',
            scrollTrigger: {
              trigger: refs.engineeringSectionRef.current,
              start: 'top 70%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      // Parallax backgrounds
      gsap.utils.toArray<HTMLElement>('.parallax-slow').forEach((elem) => {
        gsap.to(elem, {
          y: -150,
          ease: 'none',
          scrollTrigger: {
            trigger: elem,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
          },
        });
      });

      gsap.utils.toArray<HTMLElement>('.parallax-fast').forEach((elem) => {
        gsap.to(elem, {
          y: -300,
          ease: 'none',
          scrollTrigger: {
            trigger: elem,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
          },
        });
      });

      // Hide scroll indicator on scroll
      if (refs.scrollIndicatorRef.current) {
        gsap.to(refs.scrollIndicatorRef.current, {
          opacity: 0,
          y: -5,
          scrollTrigger: {
            trigger: refs.heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
          },
        });
      }

      // Events section animation - con retry para cards asíncronas
      if (refs.eventsSectionRef.current) {
        const setupEventCardsAnimation = () => {
          if (!refs.eventsSectionRef.current) return;
          
          const eventCards = refs.eventsSectionRef.current.querySelectorAll('.event-card');
          
          if (eventCards.length > 0) {
            gsap.fromTo(
              eventCards,
              {
                opacity: 0,
                y: 60,
                scale: 0.95,
              },
              {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.8,
                stagger: 0.1,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: refs.eventsSectionRef.current,
                  start: 'top 80%',
                  toggleActions: 'play none none reverse',
                },
              }
            );
          } else {
            // Si no hay cards aún, intentar de nuevo en 100ms
            setTimeout(setupEventCardsAnimation, 100);
          }
        };
        
        // Iniciar setup con un pequeño delay
        setTimeout(setupEventCardsAnimation, 100);
      }

      // Refresh ScrollTrigger after all animations are set up
      ScrollTrigger.refresh();
    });

    return () => {
      ctx.revert();
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependencies - only run once on mount
}
