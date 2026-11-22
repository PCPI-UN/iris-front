import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { z } from 'zod';

import { AuthResponse, User } from '@/types/api';

import { env } from '@/config/env';

import { api } from './api-client';

// api call definitions for auth (types, schemas, requests):
// these are not part of features as this is a module shared across features

const isUser = (value: unknown): value is User => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<User>;
  return (
    (typeof candidate.id === 'string' || typeof candidate.id === 'number') &&
    typeof candidate.firstName === 'string' &&
    typeof candidate.lastName === 'string' &&
    typeof candidate.email === 'string' &&
    typeof candidate.active === 'boolean' &&
    typeof candidate.status === 'string' &&
    Array.isArray(candidate.platformRoles) &&
    Array.isArray(candidate.platformPermissions)
  );
};

export const getUser = async (): Promise<User | null> => {
  try {
    const response = await api.get<User | { data?: User }>('/auth/me', {
      suppressErrorNotification: true,
    });
    const userCandidate: unknown =
      response && typeof response === 'object' && 'data' in response
        ? response.data
        : response;

    if (!isUser(userCandidate)) {
      return null;
    }

    const user = userCandidate;

    const userWithLegacyRole = user as
      | (User & { role?: string })
      | undefined;

    if (
      userWithLegacyRole &&
      (!userWithLegacyRole.platformRoles ||
        userWithLegacyRole.platformRoles.length === 0) &&
      userWithLegacyRole.role
    ) {
      userWithLegacyRole.platformRoles = [
        {
          id: 0,
          name: userWithLegacyRole.role === 'ADMIN' ? 'Admin' : 'User',
          scope: 'platform',
        },
      ];
    }

    return user;
  } catch {
    return null;
  }
};

const userQueryKey = ['user'];

export const getUserQueryOptions = () => {
  return queryOptions({
    queryKey: userQueryKey,
    queryFn: getUser,
  });
};

export const useUser = () => {
  const result = useQuery(getUserQueryOptions());
  return result;
};
export const useLogin = ({ onSuccess }: { onSuccess?: (user: User) => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: loginWithEmailAndPassword,
    onSuccess: (user) => {
      // Limpiar todo el cache antes de establecer el nuevo usuario
      queryClient.clear();
      queryClient.setQueryData(userQueryKey, user);
      onSuccess?.(user);
    },
  });
};

export const useRegister = ({ onSuccess }: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registerWithEmailAndPassword,
    onSuccess: () => {
      // Limpiar todo el cache tras registro exitoso
      queryClient.clear();
      onSuccess?.();
    },
  });
};

export const useLogout = ({ onSuccess }: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      // Limpiar todo el cache al hacer logout
      queryClient.clear();
      onSuccess?.();
    },
  });
};

const logout = async (): Promise<AuthResponse> => {
  // Solo con el API simulado (MSW): la cookie de sesión la gestiona el cliente.
  // Con el backend real la cookie es HttpOnly y la borra el propio /auth/logout.
  if (env.ENABLE_API_MOCKING && typeof window !== 'undefined') {
    const Cookies = (await import('js-cookie')).default;
    Cookies.remove('access_token', { path: '/' });
  }
  return api.post('/auth/logout');
};

export const loginInputSchema = z.object({
  email: z
    .string()
    .min(1, 'Este campo es obligatorio')
    .email('Correo electrónico inválido'),
  password: z.string().min(5, 'La contraseña debe tener al menos 5 caracteres'),
});

export type LoginInput = z.infer<typeof loginInputSchema>;
const loginWithEmailAndPassword = async (data: LoginInput): Promise<User> => {
  // 1. Login - setea la cookie en el backend / mock
  const response = await api.post<AuthResponse & { jwt?: string }>(
    '/auth/login',
    data,
  );

  // Solo con el API simulado (MSW), que no puede fijar la cookie desde la respuesta.
  // Con el backend real el token nunca debe quedar en una cookie legible por JavaScript.
  if (env.ENABLE_API_MOCKING && typeof window !== 'undefined' && response?.jwt) {
    const Cookies = (await import('js-cookie')).default;
    Cookies.set('access_token', response.jwt, { path: '/' });
  }

  // 2. Obtener el usuario autenticado con la cookie
  const user = await getUser();

  if (!user) {
    throw new Error('No se pudo obtener el usuario autenticado');
  }

  return user;
};

export const registerInputSchema = z.object({
  email: z
    .string()
    .min(1, 'Este campo es obligatorio')
    .email('Correo electrónico inválido'),
  firstName: z.string().min(1, 'Este campo es obligatorio'),
  lastName: z.string().min(1, 'Este campo es obligatorio'),
  password: z.string().min(5, 'La contraseña debe tener al menos 5 caracteres'),
});

export type RegisterInput = z.infer<typeof registerInputSchema>;

const registerWithEmailAndPassword = async (
  data: RegisterInput,
): Promise<AuthResponse> => {
  return api.post<AuthResponse>('/auth/signup', data);

  // return user;
};

export const refreshToken = (): Promise<AuthResponse> => {
  return api.post('/auth/refresh');
};