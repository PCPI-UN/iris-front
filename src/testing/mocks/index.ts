import { env } from '@/config/env';

export const enableMocking = async () => {
  if (env.ENABLE_API_MOCKING) {
    const { worker } = await import('./browser');
    const { initializeDb } = await import('./db');
    await initializeDb();
    return worker.start({
      onUnhandledRequest(request, print) {
        const { pathname } = new URL(request.url);

        // Ignore document/navigation requests and only warn for unhandled API calls.
        if (!pathname.startsWith('/api/')) {
          return;
        }

        print.warning();
      },
    });
  }
};
