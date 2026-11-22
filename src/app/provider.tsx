"use client";

import type { ThemeProviderProps } from "next-themes";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ErrorBoundary } from "react-error-boundary";
import * as React from "react";
import { HeroUIProvider } from "@heroui/system";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";

import { MainErrorFallback } from "@/components/errors/main";
import { Notifications } from "@/components/ui/notifications";
import { queryConfig } from "@/lib/react-query";
import { enableMocking } from "@/testing/mocks";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NonNullable<
      Parameters<ReturnType<typeof useRouter>["push"]>[1]
    >;
  }
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const [mswReady, setMswReady] = React.useState(false);
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: queryConfig,
      }),
  );

  const router = useRouter();

  React.useEffect(() => {
    enableMocking().then(() => {
      setMswReady(true);
    });
  }, []);

  if (!mswReady) {
    return <div>Cargando...</div>;
  }

  return (
    <ErrorBoundary FallbackComponent={MainErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <HeroUIProvider navigate={router.push}>
          <NextThemesProvider {...themeProps}>
            {process.env.DEV && <ReactQueryDevtools />}
            <Notifications />
            {children}
          </NextThemesProvider>
        </HeroUIProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
