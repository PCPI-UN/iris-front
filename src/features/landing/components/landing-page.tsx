'use client';

import { useRef } from 'react';
import { HeroSection } from './hero-section';
import { EventsSection } from './events-section';
import { StorySections } from './story-sections';
import { HorizontalScrollSection } from './horizontal-scroll-section';
import { DevelopersCarousel } from './developers-carousel';
import { Footer } from './cta-footer';
import { Navbar } from '@/components/layouts/navbar';
import { useLandingAnimations } from '../utils/use-landing-animations';
import '../index.css';

export function LandingPage() {
  const heroRef = useRef<HTMLElement>(null);
  const heroTextRef = useRef<HTMLDivElement>(null);
  const horizontalSectionRef = useRef<HTMLElement>(null);
  const horizontalContentRef = useRef<HTMLDivElement>(null);
  const maskTextRef = useRef<HTMLHeadingElement>(null);
  const engineeringSectionRef = useRef<HTMLElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);

  // Story sections refs
  const storySection1Ref = useRef<HTMLElement>(null);
  const storySection2Ref = useRef<HTMLElement>(null);
  const storySection3Ref = useRef<HTMLElement>(null);
  const zoomTextRef = useRef<HTMLDivElement>(null);
  const layeredTextRef = useRef<HTMLDivElement>(null);
  const revealSectionRef = useRef<HTMLElement>(null);
  const eventsSectionRef = useRef<HTMLElement>(null);
  const developersRef = useRef<HTMLElement>(null);

  // Initialize animations
  useLandingAnimations({
    heroTextRef,
    storySection1Ref,
    storySection2Ref,
    storySection3Ref,
    zoomTextRef,
    layeredTextRef,
    revealSectionRef,
    horizontalSectionRef,
    horizontalContentRef,
    maskTextRef,
    engineeringSectionRef,
    eventsSectionRef,
    heroRef,
    scrollIndicatorRef,
  });

  return (
    <main className="landing-page min-h-screen bg-background relative overflow-x-hidden">
      {/* Animated Background Gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="parallax-slow absolute top-0 left-0 w-[150%] h-[150%]"
          style={{
            background: `
              radial-gradient(circle at 20% 20%, oklch(0.75 0.15 195 / 0.15) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, oklch(0.82 0.18 330 / 0.15) 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, oklch(0.88 0.16 85 / 0.1) 0%, transparent 50%)
            `,
          }}
        />
      </div>

      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <HeroSection
        heroRef={heroRef}
        heroTextRef={heroTextRef}
        scrollIndicatorRef={scrollIndicatorRef}
      />

      {/* Story Section 1 */}
      <StorySections
        storySection1Ref={storySection1Ref}
        storySection2Ref={storySection2Ref}
        storySection3Ref={storySection3Ref}
        zoomTextRef={zoomTextRef}
        layeredTextRef={layeredTextRef}
        blocks={['section1']}
      />

      {/* Events Section */}
      <EventsSection
        eventsSectionRef={eventsSectionRef}
      />



      {/* Horizontal Scroll Section */}
      <HorizontalScrollSection
        horizontalSectionRef={horizontalSectionRef}
        horizontalContentRef={horizontalContentRef}
      />

      {/* Story Section 3 */}
      <StorySections
        storySection1Ref={storySection1Ref}
        storySection2Ref={storySection2Ref}
        storySection3Ref={storySection3Ref}
        zoomTextRef={zoomTextRef}
        layeredTextRef={layeredTextRef}
        blocks={['section3']}
      />

      {/* Developers Carousel */}
      <DevelopersCarousel
        developersRef={developersRef}
      />


      {/* Footer */}
      <Footer />
    </main>
  );
}
