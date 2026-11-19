import { ReactNode, Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { AuthLayout as AuthLayoutComponent } from "./_components/auth-layout";

import { Spinner } from "@/components/ui/spinner";

export const metadata = {
  title: "Autenticación - Iris",
  description: "Sistema de autenticación de Iris",
};

const AuthLayout = ({ children }: { children: ReactNode }) => {
  return (
    <Suspense
      fallback={
        <div className="flex size-full items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <ErrorBoundary fallback={<div>¡Algo salió mal!</div>}>
        <AuthLayoutComponent>{children}</AuthLayoutComponent>
      </ErrorBoundary>
    </Suspense>
  );
};

export default AuthLayout;
