// Navigation bar component
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { IrisLogo } from "@/features/landing/components/iris-logo";
import { landingContent } from "@/features/landing/content";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Menu, X } from "lucide-react";
import { paths } from "@/config/paths";
import { Geist } from "next/font/google";
import { useLandingNavigation } from "@/features/landing/hooks/use-landing-navigation";

interface NavbarProps {
  showNavLinks?: boolean;
  showLoginButton?: boolean;
}

const navbarFont = Geist({ subsets: ["latin"] });
// The Navbar component is responsible for rendering the navigation bar
export function Navbar({
  showNavLinks = true,
  showLoginButton = true,
}: NavbarProps) {
  const pathname = usePathname();
  const isLandingPage = pathname === "/";
  const isDevelopersPage = pathname === paths.public.developers.getHref();
  const shouldShowNavLinks =
    showNavLinks && (isLandingPage || isDevelopersPage);
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navLinkClassName =
    "text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer";
  const mobileNavLinkClassName =
    "text-sm px-6 py-4 text-muted-foreground hover:text-foreground transition-all cursor-pointer";

  const { handleSectionNavigation, handleBackToLanding } = useLandingNavigation(
    {
      isLandingPage,
      router,
      pathname,
      setIsMobileMenuOpen,
    },
  );

  return (
    <>
      <nav
        className={`${navbarFont.className} fixed top-0 left-0 right-0 z-40 px-4 sm:px-6 py-3 sm:py-4 md:px-12 glass-effect border-b border-border/30`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isDevelopersPage && (
              <Button
                isIconOnly
                size="sm"
                variant="flat"
                onClick={handleBackToLanding}
                aria-label="Volver"
                className="order-first mr-2 h-10 w-10 shrink-0 glass-effect border border-primary/40 text-primary hover:text-foreground hover:border-primary/60 shadow-[0_0_18px_oklch(0.75_0.15_195/0.45)] md:h-8 md:w-8"
              >
                <ArrowLeft
                  size={18}
                  className="drop-shadow-[0_0_6px_oklch(0.75_0.15_195/0.7)] md:h-4 md:w-4"
                />
              </Button>
            )}

            <Link href="/" className="flex items-center gap-2">
              <div className="relative">
                <IrisLogo size={36} />
                <div className="absolute inset-0 blur-xl bg-primary/30 animate-pulse" />
              </div>
            </Link>
          </div>
          {/* Show navigation links where it's due */}
          {shouldShowNavLinks && (
            <div className="hidden md:flex items-center gap-8 text-sm">
              <a
                href="#informacion"
                onClick={(e) => handleSectionNavigation(e, "informacion")}
                className={navLinkClassName}
              >
                {landingContent.navbar.links.information}
              </a>

              <a
                href="#eventos"
                onClick={(e) => handleSectionNavigation(e, "eventos")}
                className={navLinkClassName}
              >
                {landingContent.navbar.links.events}
              </a>

              <a
                href="#recorrido"
                onClick={(e) => handleSectionNavigation(e, "recorrido")}
                className={navLinkClassName}
              >
                {landingContent.navbar.links.pastEvents}
              </a>
              {/* developers link */}
              <a
                href={paths.public.developers.getHref()}
                onClick={(e) => handleSectionNavigation(e, "developers")}
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
                onClick={() => router.push("/auth/login")}
                style={{
                  background: "oklch(0.75 0.15 195)",
                  color: "oklch(0.12 0.01 264)",
                }}
              >
                {landingContent.navbar.cta}
              </Button>
            )}

            {/* Mobile Menu Button */}
            {shouldShowNavLinks && (
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
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
            isMobileMenuOpen
              ? "opacity-100 translate-y-0"
              : "opacity-0 -translate-y-4 pointer-events-none"
          }`}
        >
          <div className="mx-6 mt-2 glass-effect border border-border/30 rounded-lg overflow-hidden">
            <div className="flex flex-col">
              <a
                href="#informacion"
                onClick={(e) => handleSectionNavigation(e, "informacion")}
                className={`${mobileNavLinkClassName} border-b border-border/20`}
              >
                {landingContent.navbar.links.information}
              </a>

              <a
                href="#eventos"
                onClick={(e) => handleSectionNavigation(e, "eventos")}
                className={mobileNavLinkClassName}
              >
                {landingContent.navbar.links.events}
              </a>

              <a
                href="#recorrido"
                onClick={(e) => handleSectionNavigation(e, "recorrido")}
                className={`${mobileNavLinkClassName} border-t border-border/20`}
              >
                {landingContent.navbar.links.pastEvents}
              </a>

              <a
                href={paths.public.developers.getHref()}
                onClick={(e) => handleSectionNavigation(e, "developers")}
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
