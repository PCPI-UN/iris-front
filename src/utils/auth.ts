import { cookies } from 'next/headers';

export const AUTH_TOKEN_COOKIE_NAME = 'access_token';

export const getAuthTokenCookie = async () => {
  if (typeof window !== 'undefined') return '';
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_TOKEN_COOKIE_NAME)?.value;
};

export const checkLoggedIn = async () => {
  const cookieStore = await cookies();
  const isLoggedIn = !!cookieStore.get(AUTH_TOKEN_COOKIE_NAME);
  return isLoggedIn;
};