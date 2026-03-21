"use client";

import { useRouter, useSearchParams } from 'next/navigation';

import { paths } from "@/config/paths";
import { LoginForm } from "@/features/auth/components/login-form";
import { PublicLayout } from "@/components/layouts/public-layout";
import "@/features/landing/index.css";

const LoginPage = () => {
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get('redirectTo');

  return (
    <PublicLayout showNavLinks={false} showLoginButton={false}>
      {/* Animated Background Gradient - Same as landing */}
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

      <div className="auth-page relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-6rem)]">
        <div className="w-full max-w-2xl mb-6 sm:mb-8 text-center px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3">
            Inicia <span className="prismatic-text">sesión</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            Accede a tu cuenta para continuar
          </p>
        </div>

        <div className="w-full max-w-md px-4 sm:px-6 lg:px-8">
          <div className="glass-card p-6 sm:p-8 w-full">
            <LoginForm
              onSuccess={() => {
                // Usar window.location.href en lugar de router.replace
                // para forzar una recarga completa y asegurar que las cookies
                // se envíen correctamente en producción
                const targetUrl = redirectTo
                  ? decodeURIComponent(redirectTo)
                  : paths.app.dashboard.getHref();
                window.location.href = targetUrl;
              }}
            />
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default LoginPage;
