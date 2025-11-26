"use client";

import { useState } from "react";
import NextLink from "next/link";
import ChangePasswordForm from "@/features/auth/components/chg-password";
import { PublicLayout } from "@/components/layouts/public-layout";
import { paths } from "@/config/paths";
import "@/features/landing/index.css";

export default function Page() {
  const [tokenType, setTokenType] = useState<
    "ACCOUNT_SETUP" | "RESET_PASSWORD" | null
  >(null);

  const pageTexts = {
    title:
      tokenType === "ACCOUNT_SETUP"
        ? "¡Bienvenido a Iris!"
        : "Cambia tu contraseña",
    subtitle:
      tokenType === "ACCOUNT_SETUP"
        ? "Fuiste invitado a hacer parte de este increíble evento, ahora debes establecer tu contraseña para poder continuar"
        : "Ingresa tu nueva contraseña para continuar",
  };

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
            {tokenType === "ACCOUNT_SETUP" ? (
              <>
                ¡Bienvenido a <span className="prismatic-text">Iris</span>!
              </>
            ) : (
              <>
                Cambia tu <span className="prismatic-text">contraseña</span>
              </>
            )}
          </h1>
        </div>{" "}
        <div className="w-full max-w-md px-4 sm:px-6 lg:px-8">
          <div className="glass-card p-6 sm:p-8 w-full">
            {tokenType && (
              <p className="text-base text-muted-foreground text-center mb-6">
                {pageTexts.subtitle}
              </p>
            )}
            <ChangePasswordForm onTokenValidated={setTokenType} />
          </div>{" "}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            ¿Ya actualizaste tu contraseña?{" "}
            <NextLink
              href={paths.auth.login.getHref()}
              className="font-medium text-primary hover:underline"
            >
              Inicia sesión
            </NextLink>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
