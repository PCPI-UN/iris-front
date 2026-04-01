'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { IrisLogo } from '@/features/landing/components/iris-logo';
import { landingContent } from '@/features/landing/content';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { paths } from '@/config/paths';

interface NavbarProps {
  showNavLinks?: boolean;
  showLoginButton?: boolean;
}

export function Navbar({ showNavLinks = true, showLoginButton = true }: NavbarProps) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false); // Close mobile menu on navigation

    // Disable smooth scrolling temporarily
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

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 px-6 py-4 md:px-12 glass-effect border-b border-border/30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative">
              <IrisLogo size={40} />
              <div className="absolute inset-0 blur-xl bg-primary/30 animate-pulse" />
            </div>
          </Link>

          {showNavLinks && isLandingPage && (
            <div className="hidden md:flex items-center gap-8 text-sm">
              <a
                href="#informacion"
                onClick={(e) => handleSmoothScroll(e, 'informacion')}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {landingContent.navbar.links.information}
              </a>

               <a
                href="#eventos"
                onClick={(e) => handleSmoothScroll(e, 'eventos')}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {landingContent.navbar.links.events}
              </a>

              <a
                href="#recorrido"
                onClick={(e) => handleSmoothScroll(e, 'recorrido')}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {landingContent.navbar.links.pastEvents}
              </a>
              {/* developers link */}
              <a
                onClick={() => router.push(paths.public.developers.getHref())}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
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
            {showNavLinks && isLandingPage && (
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
      {showNavLinks && isLandingPage && (
        <div
          className={`fixed top-[73px] left-0 right-0 z-30 md:hidden transition-all duration-300 ${
            isMobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
          }`}
        >
          <div className="mx-6 mt-2 glass-effect border border-border/30 rounded-lg overflow-hidden">
            <div className="flex flex-col">
              <a
                href="#informacion"
                onClick={(e) => handleSmoothScroll(e, 'informacion')}
                className="px-6 py-4 text-muted-foreground hover:text-foreground transition-all cursor-pointer border-b border-border/20"
              >
                {landingContent.navbar.links.information}
              </a>


               <a
                href="#eventos"
                onClick={(e) => handleSmoothScroll(e, 'eventos')}
                className="px-6 py-4 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                {landingContent.navbar.links.events}
              </a>

              <a
                href="#recorrido"
                onClick={(e) => handleSmoothScroll(e, 'recorrido')}
                className="px-6 py-4 text-muted-foreground hover:text-foreground transition-all cursor-pointer border-t border-border/20"
              >
                {landingContent.navbar.links.pastEvents}
              </a>

              <a
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  router.push(paths.public.developers.getHref());
                }}
                className="px-6 py-4 text-muted-foreground hover:text-foreground transition-all cursor-pointer border-t border-border/20"
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
