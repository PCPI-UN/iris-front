import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactElement } from "react";

import { rtlRender } from "@/testing/test-utils";

/** Renders with a fresh query client (no retries) and returns it, to spy on its invalidations */
export const renderWithClient = (ui: ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  rtlRender(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );

  return { queryClient };
};

/** 4xx body as the gateway sends it */
export const gatewayError = (
  status: number,
  message: string,
  extra: { code?: string; details?: unknown } = {},
) =>
  Response.json(
    {
      statusCode: status,
      message,
      ...extra,
      timestamp: "2026-11-22T15:00:00.000Z",
    },
    { status },
  );
