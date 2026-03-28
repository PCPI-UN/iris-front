import { useNotifications } from '@/components/ui/notifications';
import { env } from '@/config/env';

type RequestOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  cookie?: string;
  params?: Record<string, string | number | boolean | undefined | null>;
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
  suppressErrorNotification?: boolean;
};

function buildUrlWithParams(
  url: string,
  params?: RequestOptions['params'],
): string {
  if (!params) return url;
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null,
    ),
  );
  if (Object.keys(filteredParams).length === 0) return url;
  const queryString = new URLSearchParams(
    filteredParams as Record<string, string>,
  ).toString();
  return `${url}?${queryString}`;
}

// Create a separate function for getting server-side cookies that can be imported where needed
export function getServerCookies() {
  if (typeof window !== 'undefined') return '';

  // Dynamic import next/headers only on server-side
  return import('next/headers').then(async ({ cookies }) => {
    try {
      const cookieStore = await cookies();
      const allCookies = cookieStore.getAll();
      return allCookies
        .map((c) => `${c.name}=${c.value}`)
        .join('; ');
    } catch (error) {
      return '';
    }
  });
}

async function fetchApi<T>(
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    method = 'GET',
    headers = {},
    body,
    cookie,
    params,
    cache = 'no-store',
    next,
    suppressErrorNotification = false,
  } = options;

  // Get cookies from the request when running on server
  let cookieHeader = cookie;
  if (typeof window === 'undefined' && !cookie) {
    cookieHeader = await getServerCookies();
  }

  // Usar rutas relativas /api/* que serán proxeadas al backend
  const fullUrl = buildUrlWithParams(`/api${url}`, params);

  // Detectar si el body es FormData
  const isFormData = body instanceof FormData;
  
  // Preparar headers
  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...headers,
    ...(cookieHeader ? { Cookie: cookieHeader } : {}),
  };
  
  // No establecer Content-Type si es FormData (el browser lo hace automáticamente con el boundary)
  if (!isFormData) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  const response = await fetch(fullUrl, {
    method,
    headers: requestHeaders,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    credentials: 'include',
    cache,
    next,
  });

  // Interceptor para 401: Refrescar token y reintentar
  // Solo intentar refresh/redirect automático si estamos en una ruta protegida.
  // En rutas públicas un 401 puede ser esperado (ej: /auth/me sin sesión).
  const isAuthEndpoint =
    url.includes('/auth/refresh') ||
    url.includes('/auth/login') ||
    url.includes('/auth/logout') ||
    url.includes('/auth/register');
  const isAuthMeEndpoint = url.includes('/auth/me');
  const isAuthPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/auth');
  const isProtectedPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/app');

  if (response.status === 401 && !isAuthEndpoint && !isAuthPage && isProtectedPage) {
    try {
      // Importación dinámica para evitar dependencia circular
      const { refreshToken } = await import('./auth');

      // Intentar refrescar el token
      await refreshToken();

      // Reintentar la petición original con el nuevo token
      const retryResponse = await fetch(fullUrl, {
        method,
        headers: requestHeaders,
        body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
        credentials: 'include',
        cache,
        next,
      });

      if (!retryResponse.ok) {
        const message = (await retryResponse.json()).message || retryResponse.statusText;
        if (typeof window !== 'undefined') {
          useNotifications.getState().addNotification({
            type: 'error',
            title: 'Error',
            message,
          });
        }
        throw new Error(message);
      }

      return retryResponse.json();
    } catch (refreshError) {
      // Si el refresh falla, redirigir al login solo si no estamos ya ahí
      if (
        typeof window !== 'undefined' &&
        window.location.pathname.startsWith('/app') &&
        !window.location.pathname.startsWith('/auth')
      ) {
        window.location.href = '/auth/login';
      }
      throw refreshError;
    }
  }

  if (!response.ok) {
    const message = (await response.json()).message || response.statusText;
    const shouldNotify =
      typeof window !== 'undefined' &&
      !suppressErrorNotification &&
      !(response.status === 401 && isAuthMeEndpoint);

    if (shouldNotify) {
      useNotifications.getState().addNotification({
        type: 'error',
        title: 'Error',
        message,
      });
    }
    throw new Error(message);
  }

  return response.json();
}

export const api = {
  get<T>(url: string, options?: RequestOptions): Promise<T> {
    return fetchApi<T>(url, { ...options, method: 'GET' });
  },
  post<T>(url: string, body?: any, options?: RequestOptions): Promise<T> {
    return fetchApi<T>(url, { ...options, method: 'POST', body });
  },
  put<T>(url: string, body?: any, options?: RequestOptions): Promise<T> {
    return fetchApi<T>(url, { ...options, method: 'PUT', body });
  },
  patch<T>(url: string, body?: any, options?: RequestOptions): Promise<T> {
    return fetchApi<T>(url, { ...options, method: 'PATCH', body });
  },
  delete<T>(url: string, body?: any, options?: RequestOptions): Promise<T> {
    return fetchApi<T>(url, { ...options, method: 'DELETE', body });
  },
};