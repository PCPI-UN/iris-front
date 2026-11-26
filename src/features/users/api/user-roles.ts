import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { api, ApiError } from "@/lib/api-client";
import { MutationConfig } from "@/lib/react-query";

export type PlatformUser = {
  id: number;
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  active: boolean;
  status: string;
  /** Active platform roles (GET /users, Iris#204); [] when the user has none */
  roles?: Role[];
};

export type Role = {
  id: number;
  name: string;
  description: string;
  /** PLATFORM roles are assigned here; EVENT roles (Juror, Participant) come from event membership */
  scope: string;
};

type UsersResponse = {
  users: PlatformUser[];
  meta?: {
    totalItems: number;
    itemsOnPage: number;
    itemsPerPage: number;
    totalPages: number;
  };
};

/** Roles the principal Admin is the only one allowed to grant or remove (manage:admins) */
export const ADMIN_ROLE_NAMES = ["Admin", "FacultyAdmin"];

// GET /users (read:users)
export const getUsers = ({ page }: { page: number }) =>
  api.get<UsersResponse>("/users", { params: { page, limit: 10 } });

export const getUsersQueryOptions = (page: number) =>
  queryOptions({
    queryKey: ["users", page],
    queryFn: () => getUsers({ page }),
  });

export const useUsers = (page: number) => useQuery(getUsersQueryOptions(page));

// GET /users/roles (read:users)
export const getRoles = async (): Promise<Role[]> => {
  const response = await api.get<{ roles?: Role[] } | Role[]>("/users/roles");
  return Array.isArray(response) ? response : (response.roles ?? []);
};

export const getRolesQueryOptions = () =>
  queryOptions({ queryKey: ["users", "roles"], queryFn: getRoles });

export const useRoles = () => useQuery(getRolesQueryOptions());

/** Only platform roles can be assigned to a user; event roles are rejected by the backend */
export const getPlatformRoles = (roles: Role[]) =>
  roles
    .filter((role) => role.scope?.toUpperCase() === "PLATFORM")
    .sort((left, right) => left.id - right.id);

// PUT /users/:id/roles (manage:user_roles): replaces every platform role of the user
export const setUserRoles = async ({
  userId,
  roleIds,
}: {
  userId: number;
  roleIds: number[];
}): Promise<Role[]> => {
  const response = await api.put<{ roles?: Role[] }>(
    `/users/${userId}/roles`,
    { roleIds },
    // The modal shows its own message
    { suppressErrorNotification: true },
  );
  return response.roles ?? [];
};

type UseSetUserRolesOptions = {
  mutationConfig?: MutationConfig<typeof setUserRoles>;
};

export const useSetUserRoles = ({
  mutationConfig,
}: UseSetUserRolesOptions = {}) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restConfig } = mutationConfig || {};

  return useMutation({
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onSuccess?.(...args);
    },
    ...restConfig,
    mutationFn: setUserRoles,
  });
};

/** Explains the administrator rules of the backend when it rejects the change */
export const getSetUserRolesErrorMessage = (error: unknown) => {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 403:
        return "No puedes hacer este cambio: nadie cambia sus propios roles, y solo el administrador principal da o quita Admin y FacultyAdmin, o cambia los roles de quien los tiene.";
      case 400:
        return "No se pudo aplicar: la plataforma debe conservar al menos un Admin activo y los roles de evento (Juror, Participant) no se asignan aquí.";
      case 404:
        return "No encontramos el usuario o alguno de los roles.";
    }
  }
  return "No se pudieron cambiar los roles. Intenta de nuevo.";
};
