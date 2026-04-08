// Navigation bar component
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@/components/ui/dropdown';
import { IrisLogo } from '@/features/landing/components/iris-logo';
import { landingContent } from '@/features/landing/content';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Menu,
  X,
  UserCircle2,
  LogOut,
  ChevronDown,
  LayoutDashboard,
} from 'lucide-react';
import { paths } from '@/config/paths';
import { Geist } from 'next/font/google';
import { useLandingNavigation } from '@/features/landing/hooks/use-landing-navigation';
import { useLogout, useUser } from '@/lib/auth';

interface NavbarProps {
  showNavLinks?: boolean;
  showLoginButton?: boolean;
}

const navbarFont = Geist({ subsets: ['latin'] });
// The Navbar component is responsible for rendering the navigation bar 
export function Navbar({ showNavLinks = true, showLoginButton = true }: NavbarProps) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';
  const isDevelopersPage = pathname === paths.public.developers.getHref();
  const isPublicEventDetail = /^\/public\/events\/[^/]+$/.test(pathname);
  const isPublicProjectPage = /^\/public\/projects\/[^/]+$/.test(pathname);
  const isLoginPage = pathname === paths.auth.login.getHref();
  const isSignupPage = pathname === paths.auth.signup.getHref();
  const shouldShowNavLinks = showNavLinks && (isLandingPage || isDevelopersPage);
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileUserMenuOpen, setIsMobileUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navLinkClassName = 'text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer';
  const mobileNavLinkClassName =
    'text-sm px-6 py-4 text-muted-foreground hover:text-foreground transition-all cursor-pointer';
  const { data: user, isLoading: isUserLoading } = useUser();

  const { mutate: logout, isPending: isLoggingOut } = useLogout({
    onSuccess: () => {
      setIsMobileMenuOpen(false);
      setIsMobileUserMenuOpen(false);
      window.location.href = paths.home.getHref();
    },
  });

  const profileLabel = user
    ? user.firstName?.trim().split(' ')[0] || user.email
    : '';

  const { handleSectionNavigation, handleBackToLanding } = useLandingNavigation({
    isLandingPage,
    router,
    pathname,
    setIsMobileMenuOpen,
  });

  const handleBack = () => {
    if (isDevelopersPage) {
      handleBackToLanding();
      return;
    }

    if (isLoginPage) {
      if (window.history.length > 1) {
        router.back();
        return;
      }

      router.push(paths.home.getHref());
      return;
    }

    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(paths.public.event.getHref());
  };

  const handleProfile = () => {
    setIsMobileMenuOpen(false);
    setIsMobileUserMenuOpen(false);
    router.push(paths.app.profile.getHref());
  };

  const handleDashboard = () => {
    setIsMobileMenuOpen(false);
    setIsMobileUserMenuOpen(false);
    router.push(paths.app.dashboard.getHref());
  };

  const handleLogout = () => {
    setIsMobileUserMenuOpen(false);
    logout();
  };

  const handleMobileMenuToggle = () => {
    const nextIsOpen = !isMobileMenuOpen;
    setIsMobileMenuOpen(nextIsOpen);

    if (!nextIsOpen) {
      setIsMobileUserMenuOpen(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const navbarSurfaceClassName = isScrolled
    ? isPublicProjectPage
      ? 'glass-effect-strong border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.28)]'
      : 'glass-effect border-border/30'
    : 'bg-transparent border-white/15 shadow-none';

  return (
    <>
      <nav
        className={`${navbarFont.className} fixed top-0 left-0 right-0 z-40 px-4 sm:px-6 py-3 sm:py-4 md:px-12 border-b transition-all duration-300 ${navbarSurfaceClassName}`}
      >
        <div className="max-w-7xl mx-auto relative flex items-center justify-between">
          <div className="flex items-center gap-2">

            <Link href="/" className="flex items-center gap-2">
              <div className="relative">
                <IrisLogo size={36} />
                <div className="absolute inset-0 blur-xl bg-primary/30 animate-pulse" />
              </div>
            </Link>

            {(isDevelopersPage || isPublicEventDetail || isLoginPage || isSignupPage) && (
              <Button
                isIconOnly
                size="sm"
                variant="flat"
                onClick={handleBack}
                aria-label="Volver"
                className="order-first mr-2 h-10 w-10 shrink-0 glass-effect border border-primary/40 text-primary hover:text-foreground hover:border-primary/60 shadow-[0_0_18px_oklch(0.75_0.15_195/0.45)] md:absolute md:right-full md:mr-6 md:h-8 md:w-8"
              >
                <ArrowLeft size={18} className="drop-shadow-[0_0_6px_oklch(0.75_0.15_195/0.7)] md:h-4 md:w-4" />
              </Button>
            )}
          </div>
{/* Show navigation links where it's due */}
          {shouldShowNavLinks && (
            <div className="hidden text-sm md:absolute md:left-1/2 md:flex md:-translate-x-1/2 md:items-center md:gap-8">
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
            {showLoginButton && !isUserLoading &&
              (user?.id ? (
                <Dropdown placement="bottom-end" shouldBlockScroll={false}>
                  <DropdownTrigger>
                    <Button
                      size="sm"
                      className="glass-effect border border-primary/40 transition-all hover:border-primary/60 hover:shadow-[0_0_18px_oklch(0.75_0.15_195/0.45)] max-w-[160px] sm:max-w-none"
                      title={profileLabel}
                      endContent={<ChevronDown size={14} />}
                    >
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/15 text-xs font-black uppercase">
                        {user.firstName?.[0] ?? user.email?.[0] ?? 'U'}
                      </span>
                      <span className="truncate text-foreground">{profileLabel}</span>
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Menú de cuenta"
                    className="min-w-[180px] rounded-lg border-none bg-transparent p-1 shadow-none glass-effect backdrop-blur-md"
                    onAction={(key) => {
                      if (key === 'dashboard') {
                        handleDashboard();
                      }
                      if (key === 'profile') {
                        handleProfile();
                      }
                      if (key === 'logout') {
                        handleLogout();
                      }
                    }}
                  >
                    <DropdownItem
                      key="dashboard"
                      startContent={<LayoutDashboard size={14} />}
                      className="rounded-md px-2.5 py-2 text-[11px] text-muted-foreground data-[hover=true]:bg-primary/10 data-[hover=true]:text-foreground"
                    >
                      Dashboard
                    </DropdownItem>
                    <DropdownItem
                      key="profile"
                      startContent={<UserCircle2 size={14} />}
                      className="rounded-md px-2.5 py-2 text-[11px] text-muted-foreground data-[hover=true]:bg-primary/10 data-[hover=true]:text-foreground"
                    >
                      Ver cuenta
                    </DropdownItem>
                    <DropdownItem
                      key="logout"
                      startContent={<LogOut size={14} />}
                      color="danger"
                      className="rounded-md px-2.5 py-2 text-[11px] data-[hover=true]:bg-danger/10"
                    >
                      {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              ) : (
                <Button
                  size="sm"
                  onClick={() => router.push(paths.auth.login.getHref())}
                  className="glass-effect border border-primary/40 transition-all hover:border-primary/60 hover:shadow-[0_0_18px_oklch(0.75_0.15_195/0.45)]"
                >
                  {landingContent.navbar.cta}
                </Button>
              ))}

            {/* Mobile Menu Button */}
            {shouldShowNavLinks && (
              <button
                type="button"
                onClick={handleMobileMenuToggle}
                className="nav-menu-toggle md:hidden p-2 text-white hover:text-white/85 transition-colors"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {shouldShowNavLinks && (
        <div
          className={`fixed top-[68px] sm:top-[72px] left-0 right-0 z-30 md:hidden transition-all duration-300 ${
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

            {showLoginButton && !isUserLoading && user?.id && (
              <div className="mx-2 mb-2 mt-1">
                <button
                  type="button"
                  onClick={() => setIsMobileUserMenuOpen((prev) => !prev)}
                  className="inline-flex w-full cursor-pointer items-center justify-between rounded-md bg-transparent px-4 py-2.5 text-left text-sm font-medium text-foreground transition-all"
                >
                  <span className="inline-flex min-w-0 items-center gap-2.5">
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/15 text-xs font-black uppercase text-foreground">
                      {user.firstName?.[0] ?? user.email?.[0] ?? 'U'}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-foreground">
                        {profileLabel}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </span>
                  </span>
                  <ChevronDown
                    size={16}
                    className={`shrink-0 transition-transform ${isMobileUserMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isMobileUserMenuOpen && (
                  <div className="mt-1.5 rounded-lg p-1.5">
                    <Link
                      href={paths.app.dashboard.getHref()}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full rounded-md px-4 py-2.5 text-sm text-muted-foreground transition-all hover:text-foreground"
                    >
                      Dashboard
                    </Link>

                    <Link
                      href={paths.app.profile.getHref()}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block w-full rounded-md px-4 py-2.5 text-sm text-muted-foreground transition-all hover:text-foreground"
                    >
                      Ver cuenta
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="block w-full cursor-pointer rounded-md px-4 py-2.5 text-left text-sm text-white transition-all hover:text-white focus:text-white active:text-white"
                    >
                      {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
