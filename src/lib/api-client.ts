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
  } = options;

  // Get cookies from the request when running on server
  let cookieHeader = cookie;
  if (typeof window === 'undefined' && !cookie) {
    cookieHeader = await getServerCookies();
  }

  // Relative URLs will be prefixed with the API base URL from environment variables
  const fullUrl = buildUrlWithParams(`/api${url}`, params);

  // Detect if the body is FormData to set headers and body correctly
  const isFormData = body instanceof FormData;
  
  // Prepare headers
  const requestHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...headers,
    ...(cookieHeader ? { Cookie: cookieHeader } : {}),
  };
  
  // Set Content-Type to application/json if body is not FormData and Content-Type is not already set
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

  // If response is 401, attempt to refresh token and retry the request
  // Only do this if:
  // 1. It's not an auth endpoint
  // 2. We are not already on an auth page (to avoid redirect loops)
  const isAuthEndpoint = url.includes('/auth/refresh') || url.includes('/auth/login') || url.includes('/auth/logout') || url.includes('/auth/register');
  const isAuthPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/auth');

  if (response.status === 401 && !isAuthEndpoint && !isAuthPage) {
    try {
      // Dynamically import the refreshToken function to avoid circular dependencies and only load it when needed
      const { refreshToken } = await import('./auth');

      // Try to refresh the token
      await refreshToken();

      // Retry the original request with the new token
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
      // If refresh fails, redirect to login page and show notification
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
        window.location.href = '/auth/login';
      }
      throw refreshError;
    }
  }

  if (!response.ok) {
    const message = (await response.json()).message || response.statusText;
    if (typeof window !== 'undefined') {
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