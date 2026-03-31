import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { z } from 'zod';

import { AuthResponse, User } from '@/types/api';

import { api } from './api-client';

// api call definitions for auth (types, schemas, requests):
// these are not part of features as this is a module shared across features

const isUser = (value: unknown): value is User => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<User>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.firstName === 'string' &&
    typeof candidate.lastName === 'string' &&
    typeof candidate.email === 'string'
  );
};

export const getUser = async (): Promise<User | null> => {
  try {
    const response = await api.get<User | { data?: User }>('/auth/me');
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
export const useLogin = ({ onSuccess }: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: loginWithEmailAndPassword,
    onSuccess: (user) => {
      // Limpiar todo el cache antes de establecer el nuevo usuario
      queryClient.clear();
      queryClient.setQueryData(userQueryKey, user);
      onSuccess?.();
    },
  });
};

export const useRegister = ({ onSuccess }: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registerWithEmailAndPassword,
    onSuccess: (user) => {
      // Limpiar todo el cache antes de establecer el nuevo usuario
      queryClient.clear();
      queryClient.setQueryData(userQueryKey, user);
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

const logout = (): Promise<AuthResponse> => {
  return api.post('/auth/logout');
};

export const loginInputSchema = z.object({
  email: z.string().min(1, 'Required').email('Invalid email'),
  password: z.string().min(5, 'Required'),
});

export type LoginInput = z.infer<typeof loginInputSchema>;
const loginWithEmailAndPassword = async (data: LoginInput): Promise<User> => {
  // 1. Login - setea la cookie en el backend
  await api.post<AuthResponse>('/auth/login', data);

  // 2. Obtener el usuario autenticado con la cookie
  const user = await getUser();

  if (!user) {
    throw new Error('No se pudo obtener el usuario autenticado');
  }

  return user;
};

export const registerInputSchema = z.object({
  email: z.string().min(1, 'Required').email('Invalid email'),
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  password: z.string().min(5, 'Required'),
});

export type RegisterInput = z.infer<typeof registerInputSchema>;

const registerWithEmailAndPassword = async (
  data: RegisterInput,
): Promise<User> => {
  // 1. Register - setea la cookie en el backend
  await api.post<AuthResponse>('/auth/register', data);

  // 2. Obtener el usuario autenticado con la cookie
  const user = await getUser();

  if (!user) {
    throw new Error('No se pudo obtener el usuario autenticado');
  }

  return user;
};

export const refreshToken = (): Promise<AuthResponse> => {
  return api.post('/auth/refresh');
};