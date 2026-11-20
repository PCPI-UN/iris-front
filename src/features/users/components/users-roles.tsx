"use client";

import { useEffect, useMemo, useState } from "react";

import { Can } from "@/components/auth/can";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/modal";
import { useNotifications } from "@/components/ui/notifications";
import { Pagination } from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUser } from "@/lib/auth";
import { hasPermission, PERMISSIONS } from "@/lib/authorization";

import {
  ADMIN_ROLE_NAMES,
  getPlatformRoles,
  getSetUserRolesErrorMessage,
  PlatformUser,
  Role,
  useRoles,
  useSetUserRoles,
  useUsers,
} from "../api/user-roles";

const fullName = (user: PlatformUser) =>
  `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email;

type EditRolesModalProps = {
  user: PlatformUser | null;
  roles: Role[];
  canManageAdmins: boolean;
  onClose: () => void;
  onSaved: (userId: number, roles: Role[]) => void;
};

const EditRolesModal = ({
  user,
  roles,
  canManageAdmins,
  onClose,
  onSaved,
}: EditRolesModalProps) => {
  const { addNotification } = useNotifications();
  const [selected, setSelected] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  // The modal opens with the roles the user holds today
  const currentRoleIds = useMemo(
    () => (user?.roles ?? []).map((role) => role.id).sort((a, b) => a - b),
    [user],
  );
  useEffect(() => {
    setSelected(currentRoleIds);
    setError(null);
  }, [currentRoleIds]);

  const hasChanges =
    selected.length !== currentRoleIds.length ||
    [...selected]
      .sort((a, b) => a - b)
      .some((id, i) => id !== currentRoleIds[i]);

  const mutation = useSetUserRoles({
    mutationConfig: {
      onSuccess: (newRoles, { userId }) => {
        onSaved(userId, newRoles);
        addNotification({
          type: "success",
          title: "Roles actualizados",
          message: `Ahora tiene: ${newRoles.map((role) => role.name).join(", ") || "sin roles"}.`,
        });
        setSelected([]);
        onClose();
      },
      onError: (err) => setError(getSetUserRolesErrorMessage(err)),
    },
  });

  const close = () => {
    if (mutation.isPending) return;
    setSelected([]);
    setError(null);
    onClose();
  };

  const toggle = (roleId: number, isOn: boolean) =>
    setSelected((current) =>
      isOn ? [...current, roleId] : current.filter((id) => id !== roleId),
    );

  return (
    <Modal isOpen={!!user} onOpenChange={(open) => !open && close()}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          Cambiar roles
          {user && (
            <span className="text-sm font-normal text-default-500">
              {fullName(user)} · {user.email}
            </span>
          )}
        </ModalHeader>
        <ModalBody>
          <p className="text-sm text-default-500">
            Aparecen marcados los roles que tiene hoy. Al guardar, los roles
            marcados <strong>reemplazan</strong> a los actuales. Debe quedar al
            menos uno.
          </p>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger"
            >
              {error}
            </div>
          )}

          <ul className="space-y-3">
            {roles.map((role) => {
              const isAdminRole = ADMIN_ROLE_NAMES.includes(role.name);
              const isLocked = isAdminRole && !canManageAdmins;
              return (
                <li
                  key={role.id}
                  className="flex items-start justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-medium">{role.name}</p>
                    <p className="text-xs text-default-500">
                      {isLocked
                        ? "Solo el administrador principal puede dar este rol."
                        : role.description}
                    </p>
                  </div>
                  <Switch
                    size="sm"
                    aria-label={role.name}
                    isSelected={selected.includes(role.id)}
                    isDisabled={isLocked || mutation.isPending}
                    onValueChange={(isOn) => toggle(role.id, isOn)}
                  />
                </li>
              );
            })}
          </ul>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="flat"
            onPress={close}
            isDisabled={mutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            color="primary"
            isDisabled={selected.length === 0 || !hasChanges}
            isLoading={mutation.isPending}
            onPress={() => {
              if (!user) return;
              setError(null);
              mutation.mutate({ userId: user.id, roleIds: selected });
            }}
          >
            Guardar roles
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

/**
 * Platform roles and users (GET /users/roles and GET /users, read:users).
 * Changing roles (PUT /users/:id/roles) needs manage:user_roles.
 */
export const UsersRoles = () => {
  const { data: sessionUser } = useUser();
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<PlatformUser | null>(null);
  // Roles just saved, shown until GET /users reloads with them
  const [assignedRoles, setAssignedRoles] = useState<Record<number, Role[]>>(
    {},
  );

  const usersQuery = useUsers(page);
  const rolesQuery = useRoles();
  const platformRoles = getPlatformRoles(rolesQuery.data ?? []);
  const canManageAdmins = hasPermission(sessionUser, PERMISSIONS.manageAdmins);

  // GET /users brings each user's active platform roles. The table caches rows
  // by item, so the roles go in the item for the row to re-render when they change
  const users = (usersQuery.data?.users ?? []).map((user) => ({
    ...user,
    roles: assignedRoles[user.id] ?? user.roles ?? [],
  }));
  const totalPages = usersQuery.data?.meta?.totalPages ?? 1;

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Roles de plataforma</h2>
          <p className="text-sm text-default-500">
            Lo que puede hacer cada rol en la plataforma. Los roles de evento
            (jurado y participante) se dan al invitar o inscribir a alguien en
            un evento.
          </p>
        </div>
        {rolesQuery.isLoading ? (
          <Spinner size="sm" />
        ) : rolesQuery.isError ? (
          <p role="alert" className="text-sm text-danger">
            No pudimos cargar los roles.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {platformRoles.map((role) => (
              <div
                key={role.id}
                className="glass-card rounded-xl border border-border/30 p-4"
              >
                <p className="font-medium">{role.name}</p>
                <p className="mt-1 text-sm text-default-500">
                  {role.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Usuarios</h2>
        {usersQuery.isError ? (
          <p role="alert" className="text-sm text-danger">
            No pudimos cargar los usuarios.
          </p>
        ) : (
          <Table aria-label="Usuarios de la plataforma" removeWrapper>
            <TableHeader>
              <TableColumn>Nombre</TableColumn>
              <TableColumn>Correo</TableColumn>
              <TableColumn>Estado</TableColumn>
              <TableColumn>Roles</TableColumn>
              <TableColumn>Acciones</TableColumn>
            </TableHeader>
            <TableBody
              items={users}
              isLoading={usersQuery.isLoading}
              loadingContent={<Spinner />}
              emptyContent="No hay usuarios."
            >
              {(user) => {
                const isSelf = Number(sessionUser?.id) === user.id;
                const roles = user.roles;
                return (
                  <TableRow key={user.id}>
                    <TableCell>{fullName(user)}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        variant="flat"
                        color={user.active ? "success" : "default"}
                      >
                        {user.active ? "Activo" : "Inactivo"}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      {roles.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {roles.map((role) => (
                            <Chip key={role.id} size="sm" variant="flat">
                              {role.name}
                            </Chip>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-default-400">
                          Sin roles
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Can permission={PERMISSIONS.manageUserRoles}>
                        <Button
                          size="sm"
                          variant="flat"
                          isDisabled={isSelf || platformRoles.length === 0}
                          title={
                            isSelf
                              ? "No puedes cambiar tus propios roles"
                              : undefined
                          }
                          onPress={() => setEditing(user)}
                        >
                          Cambiar roles
                        </Button>
                      </Can>
                    </TableCell>
                  </TableRow>
                );
              }}
            </TableBody>
          </Table>
        )}
        {totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination
              total={totalPages}
              page={page}
              onChange={setPage}
              showControls
            />
          </div>
        )}
      </section>

      <EditRolesModal
        user={editing}
        roles={platformRoles}
        canManageAdmins={canManageAdmins}
        onClose={() => setEditing(null)}
        onSaved={(userId, roles) =>
          setAssignedRoles((current) => ({ ...current, [userId]: roles }))
        }
      />
    </div>
  );
};
