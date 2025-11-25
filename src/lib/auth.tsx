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

export const getUser = async (): Promise<User> => {
  const user = await api.get<User>('/auth/me');

  if (!user || !user.id) {
    throw new Error('Invalid user data received from server');
  }

  return user;
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

  return user;
};

export const registerInputSchema = z
  .object({
    email: z.string().min(1, 'Required'),
    firstName: z.string().min(1, 'Required'),
    lastName: z.string().min(1, 'Required'),
    password: z.string().min(5, 'Required'),
  })
  .and(
    z
      .object({
        teamId: z.string().min(1, 'Required'),
        teamName: z.null().default(null),
      })
      .or(
        z.object({
          teamName: z.string().min(1, 'Required'),
          teamId: z.null().default(null),
        }),
      ),
  );

export type RegisterInput = z.infer<typeof registerInputSchema>;

const registerWithEmailAndPassword = async (
  data: RegisterInput,
): Promise<User> => {
  // 1. Register - setea la cookie en el backend
  await api.post<AuthResponse>('/auth/register', data);

  // 2. Obtener el usuario autenticado con la cookie
  const user = await getUser();

  return user;
};

export const refreshToken = (): Promise<AuthResponse> => {
  return api.post('/auth/refresh');
};