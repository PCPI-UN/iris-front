'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from '@/components/ui/dropdown';
import { IrisLogo } from '@/features/landing/components/iris-logo';
import { landingContent } from '@/features/landing/content';
import { paths } from '@/config/paths';
import { useLogout, useUser } from '@/lib/auth';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Menu,
  X,
  UserCircle2,
  LogOut,
  ChevronDown,
} from 'lucide-react';

interface NavbarProps {
  showNavLinks?: boolean;
  showLoginButton?: boolean;
}

export function Navbar({ showNavLinks = true, showLoginButton = true }: NavbarProps) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';
  const isPublicEventDetail = /^\/public\/events\/[^/]+$/.test(pathname);
  const isLoginPage = pathname === '/auth/login';
  const router = useRouter();
  const { data: user, isLoading: isUserLoading } = useUser();
  const { mutate: logout, isPending: isLoggingOut } = useLogout({
    onSuccess: () => {
      setIsMobileMenuOpen(false);
      router.push(paths.home.getHref());
    },
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const profileLabel = user
    ? `${user.firstName} ${user.lastName}`.trim() || user.email
    : '';

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false); // Close mobile menu on navigation
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  const handleBack = () => {
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
    router.push(paths.app.profile.getHref());
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 px-6 py-4 md:px-12 glass-effect border-b border-border/30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="relative flex items-center">
            <Link href={paths.home.getHref()} className="flex items-center gap-2">
              <div className="relative">
                <IrisLogo size={40} />
                <div className="absolute inset-0 blur-xl bg-primary/30 animate-pulse" />
              </div>
            </Link>

            {(isPublicEventDetail || isLoginPage) && (
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
                href="#ingenierias"
                onClick={(e) => handleSmoothScroll(e, 'ingenierias')}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {landingContent.navbar.links.engineering}
              </a>
              
              <a
                href="#eventos"
                onClick={(e) => handleSmoothScroll(e, 'eventos')}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {landingContent.navbar.links.events}
              </a>

              <a
                href="#ganadores"
                onClick={(e) => handleSmoothScroll(e, 'ganadores')}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {landingContent.navbar.links.winners}
              </a>
            </div>
          )}

          <div className="flex items-center gap-3">
            {showLoginButton && !isUserLoading &&
              (user?.id ? (
                <Dropdown placement="bottom-end">
                  <DropdownTrigger>
                    <Button
                      size="sm"
                      className="max-w-[260px] truncate transition-opacity hover:opacity-90"
                      style={{
                        background: 'oklch(0.75 0.15 195)',
                        color: 'oklch(0.12 0.01 264)',
                      }}
                      title={profileLabel}
                      endContent={<ChevronDown size={14} />}
                    >
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/15 text-xs font-black uppercase">
                        {user.firstName?.[0] ?? user.email?.[0] ?? 'U'}
                      </span>
                      <span className="truncate">{profileLabel}</span>
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Menú de cuenta"
                    onAction={(key) => {
                      if (key === 'profile') {
                        handleProfile();
                      }
                      if (key === 'logout') {
                        handleLogout();
                      }
                    }}
                  >
                    <DropdownItem
                      key="profile"
                      startContent={<UserCircle2 size={16} />}
                    >
                      Ver cuenta
                    </DropdownItem>
                    <DropdownItem
                      key="logout"
                      startContent={<LogOut size={16} />}
                      color="danger"
                    >
                      {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              ) : (
                <Button
                  size="sm"
                  onClick={() => router.push('/auth/login')}
                  className="transition-opacity hover:opacity-90"
                  style={{
                    background: 'oklch(0.75 0.15 195)',
                    color: 'oklch(0.12 0.01 264)',
                  }}
                >
                  {landingContent.navbar.cta}
                </Button>
              ))}

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
                href="#ingenierias"
                onClick={(e) => handleSmoothScroll(e, 'ingenierias')}
                className="px-6 py-4 text-muted-foreground hover:text-foreground transition-all cursor-pointer border-b border-border/20"
              >
                {landingContent.navbar.links.engineering}
              </a>
              
              <a
                href="#eventos"
                onClick={(e) => handleSmoothScroll(e, 'eventos')}
                className="px-6 py-4 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                {landingContent.navbar.links.events}
              </a>

              <a
                href="#ganadores"
                onClick={(e) => handleSmoothScroll(e, 'ganadores')}
                className="px-6 py-4 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                {landingContent.navbar.links.winners}
              </a>
            </div>

            {showLoginButton && !isUserLoading && user?.id && (
              <div className="border-t border-border/20">
                <button
                  type="button"
                  onClick={handleProfile}
                  className="w-full px-6 py-4 text-left text-muted-foreground hover:text-foreground transition-all cursor-pointer border-b border-border/20 inline-flex items-center gap-2"
                >
                  <UserCircle2 size={16} /> Ver cuenta
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full px-6 py-4 text-left text-danger hover:opacity-80 transition-all cursor-pointer inline-flex items-center gap-2 disabled:opacity-60"
                >
                  <LogOut size={16} />
                  {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
