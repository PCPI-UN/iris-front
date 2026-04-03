// Navigation bar component
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { IrisLogo } from '@/features/landing/components/iris-logo';
import { landingContent } from '@/features/landing/content';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, Menu, X } from 'lucide-react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { paths } from '@/config/paths';
import { Geist } from 'next/font/google';

interface NavbarProps {
  showNavLinks?: boolean;
  showLoginButton?: boolean;
}

const LANDING_SCROLL_TARGET_KEY = 'landing-scroll-target';
const validLandingTargets = ['informacion', 'eventos', 'recorrido'] as const;
type LandingTarget = (typeof validLandingTargets)[number];
const navbarFont = Geist({ subsets: ['latin'] });

export function Navbar({ showNavLinks = true, showLoginButton = true }: NavbarProps) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';
  const isDevelopersPage = pathname === paths.public.developers.getHref();
  const shouldShowNavLinks = showNavLinks && (isLandingPage || isDevelopersPage);
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navLinkClassName = 'text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer';
  const mobileNavLinkClassName =
    'text-sm px-6 py-4 text-muted-foreground hover:text-foreground transition-all cursor-pointer';

  const smoothScrollToTarget = (targetId: string) => {
    setIsMobileMenuOpen(false);

    const html = document.documentElement;
    const originalBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';

    const horizontalTargetPanelIndex =
      targetId === 'informacion' ? 0 : targetId === 'recorrido' ? 2 : null;

    const scrollToPosition = (position: number) => {
      const targetTop = Math.max(0, Math.round(position));
      window.scrollTo({ top: targetTop, behavior: 'auto' });
      document.documentElement.scrollTop = targetTop;
      document.body.scrollTop = targetTop;
    };

    const getNavbarHeight = () => {
      const navbar = document.querySelector('nav');
      return navbar?.getBoundingClientRect().height ?? 0;
    };

    if (horizontalTargetPanelIndex !== null) {
      const horizontalSection = document.getElementById('informacion');

      if (horizontalSection) {
        const pinSpacer = horizontalSection.parentElement?.classList.contains('pin-spacer')
          ? horizontalSection.parentElement
          : null;

        const panels = horizontalSection.querySelectorAll('.horizontal-panel');
        const panelsCount = panels.length;
        const maxIndex = Math.max(panelsCount - 1, 0);
        const targetPanelIndex = Math.min(horizontalTargetPanelIndex, maxIndex);
        const progress = maxIndex > 0 ? targetPanelIndex / maxIndex : 0;

        const navHeight = getNavbarHeight();
        const visualCenterOffset = navHeight / 2;
        const informationExtraOffset = targetId === 'informacion' ? -50 : 0;

        const currentTriggers = ScrollTrigger.getAll();
        const horizontalTrigger = currentTriggers.find(
          (trigger) => trigger.trigger === horizontalSection
        );

        if (horizontalTrigger) {
          const triggerDistance = Math.max(horizontalTrigger.end - horizontalTrigger.start, 0);
          const triggerTarget = horizontalTrigger.start + triggerDistance * progress;
          scrollToPosition(triggerTarget - visualCenterOffset - informationExtraOffset);
        } else {
          const sectionTop = pinSpacer
            ? pinSpacer.getBoundingClientRect().top + window.scrollY
            : horizontalSection.getBoundingClientRect().top + window.scrollY;
          const horizontalContent = horizontalSection.querySelector('.flex') as HTMLElement | null;
          const horizontalDistance = horizontalContent
            ? Math.max(horizontalContent.scrollWidth - horizontalSection.clientWidth, 0)
            : 0;
          const fallbackTravel = horizontalDistance * 0.6;
          const fallbackTarget = sectionTop + fallbackTravel * progress;
          scrollToPosition(fallbackTarget - visualCenterOffset - informationExtraOffset);
        }

        // Restore original scroll behavior
        html.style.scrollBehavior = originalBehavior;
        return;
      }
    }

    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      const targetTop = targetElement.getBoundingClientRect().top + window.scrollY;
      const navHeight = getNavbarHeight();
      scrollToPosition(targetTop - navHeight / 2);
    }

    // Restore original scroll behavior
    html.style.scrollBehavior = originalBehavior;
  };

  useEffect(() => {
    if (!isLandingPage) return;

    const pendingTarget = sessionStorage.getItem(LANDING_SCROLL_TARGET_KEY);
    if (pendingTarget && validLandingTargets.includes(pendingTarget as LandingTarget)) {
      sessionStorage.removeItem(LANDING_SCROLL_TARGET_KEY);
      requestAnimationFrame(() => {
        smoothScrollToTarget(pendingTarget);
        window.history.replaceState(null, '', '/');
      });
      return;
    }

    const hash = window.location.hash.replace('#', '');
    if (!hash) return;

    if (hash === 'informacion' || hash === 'eventos' || hash === 'recorrido') {
      requestAnimationFrame(() => {
        smoothScrollToTarget(hash);
      });
    }
  }, [isLandingPage, pathname]);

  const handleSectionNavigation = (
    e: React.MouseEvent<HTMLAnchorElement>,
    targetId: 'informacion' | 'eventos' | 'recorrido' | 'developers'
  ) => {
    e.preventDefault();

    if (isLandingPage && targetId !== 'developers') {
      smoothScrollToTarget(targetId);
      return;
    }
    setIsMobileMenuOpen(false);

    if (targetId === 'developers') {
      router.push(paths.public.developers.getHref(), { scroll: false });
      return;
    }

    sessionStorage.setItem(LANDING_SCROLL_TARGET_KEY, targetId);
    router.push('/');
  };

  const handleBackToLanding = () => {
    setIsMobileMenuOpen(false);
    router.push(paths.home.getHref(), { scroll: false });
  };

  return (
    <>
      <nav className={`${navbarFont.className} fixed top-0 left-0 right-0 z-40 px-6 py-4 md:px-12 glass-effect border-b border-border/30`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isDevelopersPage && (
              <button
                type="button"
                onClick={handleBackToLanding}
                aria-label="Volver al landing"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary/40 text-primary transition-all hover:border-primary/60 hover:text-foreground hover:shadow-[0_0_18px_oklch(0.75_0.15_195_/_0.45)] md:h-8 md:w-8"
              >
                <ArrowLeft size={18} className="drop-shadow-[0_0_6px_oklch(0.75_0.15_195_/_0.7)] md:h-4 md:w-4" />
              </button>
            )}

            <Link href="/" className="flex items-center gap-2">
              <div className="relative">
                <IrisLogo size={40} />
                <div className="absolute inset-0 blur-xl bg-primary/30 animate-pulse" />
              </div>
            </Link>
          </div>

          {shouldShowNavLinks && (
            <div className="hidden md:flex items-center gap-8 text-sm">
              <a
                href="#informacion"
                onClick={(e) => handleSectionNavigation(e, 'informacion')}
                className={navLinkClassName}
              >
                {landingContent.navbar.links.information}
              </a>

               <a
                href="#eventos"
                onClick={(e) => handleSectionNavigation(e, 'eventos')}
                className={navLinkClassName}
              >
                {landingContent.navbar.links.events}
              </a>

              <a
                href="#recorrido"
                onClick={(e) => handleSectionNavigation(e, 'recorrido')}
                className={navLinkClassName}
              >
                {landingContent.navbar.links.pastEvents}
              </a>
              {/* developers link */}
              <a
                href={paths.public.developers.getHref()}
                onClick={(e) => handleSectionNavigation(e, 'developers')}
                className={navLinkClassName}
              >
                {landingContent.navbar.links.developers}
              </a>
            </div>
          )}

          <div className="flex items-center gap-3">
            {showLoginButton && (
              <Button
                size="sm"
                onClick={() => router.push('/auth/login')}
                style={{ 
                  background: 'oklch(0.75 0.15 195)',
                  color: 'oklch(0.12 0.01 264)'
                }}
              >
                {landingContent.navbar.cta}
              </Button>
            )}

            {/* Mobile Menu Button */}
            {shouldShowNavLinks && (
              <a
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-white hover:text-primary transition-colors"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {shouldShowNavLinks && (
        <div
          className={`fixed top-[73px] left-0 right-0 z-30 md:hidden transition-all duration-300 ${
            isMobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
          }`}
        >
          <div className="mx-6 mt-2 glass-effect border border-border/30 rounded-lg overflow-hidden">
            <div className="flex flex-col">
              <a
                href="#informacion"
                onClick={(e) => handleSectionNavigation(e, 'informacion')}
                className={`${mobileNavLinkClassName} border-b border-border/20`}
              >
                {landingContent.navbar.links.information}
              </a>


               <a
                href="#eventos"
                onClick={(e) => handleSectionNavigation(e, 'eventos')}
                className={mobileNavLinkClassName}
              >
                {landingContent.navbar.links.events}
              </a>

              <a
                href="#recorrido"
                onClick={(e) => handleSectionNavigation(e, 'recorrido')}
                className={`${mobileNavLinkClassName} border-t border-border/20`}
              >
                {landingContent.navbar.links.pastEvents}
              </a>

              <a
                href={paths.public.developers.getHref()}
                onClick={(e) => handleSectionNavigation(e, 'developers')}
                className={`${mobileNavLinkClassName} border-t border-border/20`}
              >
                {landingContent.navbar.links.developers}
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
