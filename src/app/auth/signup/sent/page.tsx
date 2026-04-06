"use client";

import { PublicLayout } from "@/components/layouts/public-layout";
import { SignupEmailSent } from "@/features/auth/components/signup-email-sent";
import "@/features/landing/index.css";

export default function SignupSentPage() {
  return (
    <PublicLayout showNavLinks={false} showLoginButton={false}>
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
            Revisa tu <span className="prismatic-text">correo</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            Falta un paso para activar tu cuenta
          </p>
        </div>

        <div className="w-full max-w-md px-4 sm:px-6 lg:px-8">
          <div className="glass-card p-6 sm:p-8 w-full">
            <SignupEmailSent />
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
