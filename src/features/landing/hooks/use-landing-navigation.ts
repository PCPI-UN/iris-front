'use client';
// Logic for handling navigation on the landing page, including smooth scrolling to sections and managing mobile menu state.
import { useLayoutEffect } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { paths } from '@/config/paths';

const LANDING_SCROLL_TARGET_KEY = 'landing-scroll-target';
const validLandingTargets = ['informacion', 'eventos', 'recorrido'] as const;

export type LandingTarget = (typeof validLandingTargets)[number];

type HandleSectionEvent = React.MouseEvent<HTMLAnchorElement>;

type LandingRouter = {
  push: (href: string, options?: { scroll?: boolean }) => void;
};

type UseLandingNavigationParams = {
  isLandingPage: boolean;
  router: LandingRouter;
  pathname: string;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
};

type UseLandingNavigationResult = {
  handleSectionNavigation: (
    event: HandleSectionEvent,
    targetId: LandingTarget | 'developers'
  ) => void;
  handleBackToLanding: () => void;
};

const isLandingTarget = (value: string): value is LandingTarget => {
  return validLandingTargets.includes(value as LandingTarget);
};

const getNavbarHeight = () => {
  const navbar = document.querySelector('nav');
  return navbar?.getBoundingClientRect().height ?? 0;
};

const getScrollOffset = () => {
  return getNavbarHeight() + 12;
};

const scrollToPosition = (position: number) => {
  const targetTop = Math.max(0, Math.round(position));
  window.scrollTo({ top: targetTop, behavior: 'auto' });
  document.documentElement.scrollTop = targetTop;
  document.body.scrollTop = targetTop;
};

const resolveHorizontalTarget = (
  targetId: LandingTarget,
  horizontalSection: HTMLElement,
  progress: number
) => {
  const currentTriggers = ScrollTrigger.getAll();
  const horizontalTrigger = currentTriggers.find(
    (trigger) => trigger.trigger === horizontalSection
  );

  if (horizontalTrigger) {
    const triggerDistance = Math.max(horizontalTrigger.end - horizontalTrigger.start, 0);
    const rawTarget = horizontalTrigger.start + triggerDistance * progress;

    return Math.min(
      Math.max(rawTarget, horizontalTrigger.start),
      horizontalTrigger.end
    );
  }

  const pinSpacer = horizontalSection.parentElement?.classList.contains('pin-spacer')
    ? horizontalSection.parentElement
    : null;

  const sectionTop = pinSpacer
    ? pinSpacer.getBoundingClientRect().top + window.scrollY
    : horizontalSection.getBoundingClientRect().top + window.scrollY;

  const horizontalContent = horizontalSection.querySelector('.flex') as HTMLElement | null;
  const horizontalDistance = horizontalContent
    ? Math.max(horizontalContent.scrollWidth - horizontalSection.clientWidth, 0)
    : 0;

  return sectionTop + horizontalDistance * progress;
};

const smoothScrollToTarget = (targetId: LandingTarget, closeMobileMenu: () => void) => {
  closeMobileMenu();

  const html = document.documentElement;
  const originalBehavior = html.style.scrollBehavior;
  html.style.scrollBehavior = 'auto';

  const horizontalTargetPanelIndex =
    targetId === 'informacion' ? 0 : targetId === 'recorrido' ? 2 : null;

  if (horizontalTargetPanelIndex !== null) {
    const horizontalSection = document.getElementById('informacion');

    if (horizontalSection) {
      ScrollTrigger.refresh();

      const panels = horizontalSection.querySelectorAll('.horizontal-panel');
      const maxIndex = Math.max(panels.length - 1, 0);
      const targetPanelIndex = Math.min(horizontalTargetPanelIndex, maxIndex);
      const progress = maxIndex > 0 ? targetPanelIndex / maxIndex : 0;

      const target = resolveHorizontalTarget(targetId, horizontalSection, progress);
      scrollToPosition(target);

      html.style.scrollBehavior = originalBehavior;
      return;
    }
  }

  const targetElement = document.getElementById(targetId);
  if (targetElement) {
    const targetTop = targetElement.getBoundingClientRect().top + window.scrollY;
    scrollToPosition(targetTop - getScrollOffset());
  }

  html.style.scrollBehavior = originalBehavior;
};

const scrollToTargetWhenReady = (
  targetId: LandingTarget,
  closeMobileMenu: () => void,
  attempts = 0
) => {
  if (targetId === 'eventos') {
    smoothScrollToTarget(targetId, closeMobileMenu);
    return;
  }

  const horizontalSection = document.getElementById('informacion');
  const hasHorizontalTrigger = ScrollTrigger.getAll().some(
    (trigger) => trigger.trigger === horizontalSection
  );

  if (hasHorizontalTrigger || attempts >= 24) {
    smoothScrollToTarget(targetId, closeMobileMenu);
    return;
  }

  requestAnimationFrame(() => {
    scrollToTargetWhenReady(targetId, closeMobileMenu, attempts + 1);
  });
};

export function useLandingNavigation({
  isLandingPage,
  router,
  pathname,
  setIsMobileMenuOpen,
}: UseLandingNavigationParams): UseLandingNavigationResult {
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  useLayoutEffect(() => {
    if (!isLandingPage) return;

    const pendingTarget = sessionStorage.getItem(LANDING_SCROLL_TARGET_KEY);
    if (pendingTarget && isLandingTarget(pendingTarget)) {
      sessionStorage.removeItem(LANDING_SCROLL_TARGET_KEY);
      scrollToTargetWhenReady(pendingTarget, closeMobileMenu);
      window.history.replaceState(null, '', '/');
      return;
    }

    const hash = window.location.hash.replace('#', '');
    if (!hash || !isLandingTarget(hash)) return;

    scrollToTargetWhenReady(hash, closeMobileMenu);
  }, [isLandingPage, pathname]);

  const handleSectionNavigation = (
    event: HandleSectionEvent,
    targetId: LandingTarget | 'developers'
  ) => {
    event.preventDefault();

    if (isLandingPage && targetId !== 'developers') {
      scrollToTargetWhenReady(targetId, closeMobileMenu);
      return;
    }

    closeMobileMenu();

    if (targetId === 'developers') {
      router.push(paths.public.developers.getHref(), { scroll: false });
      return;
    }

    sessionStorage.setItem(LANDING_SCROLL_TARGET_KEY, targetId);

    if (targetId === 'eventos') {
      router.push('/#eventos', { scroll: false });
      return;
    }

    router.push('/#informacion', { scroll: false });
  };

  const handleBackToLanding = () => {
    closeMobileMenu();
    router.push(paths.home.getHref(), { scroll: false });
  };

  return {
    handleSectionNavigation,
    handleBackToLanding,
  };
}
