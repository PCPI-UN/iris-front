"use client";

import { useState, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { SearchIcon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { useJuryInvitations } from "../api/get-juries";
import { Spinner } from "@/components/ui/spinner";
import { Pagination } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Select, SelectItem } from "@/components/ui/select";
import { useEventsDropdown } from "@/features/events/api/get-events-dropdown";
import { InviteModal } from "./invite-modal";
import { AcceptInvitationModal } from "./accept-invitation-modal";
import { ResendInvitationButton } from "./resend-invitation-button";
import type { InvitationStatus } from "@/types/api";

export const JuriesList = () => {
  const [filterValue, setFilterValue] = useState("");
  const [selectedEventKey, setSelectedEventKey] = useState<string>("");
  const rowsPerPage = 10;

  const searchParams = useSearchParams();
  const router = useRouter();

  const page = useMemo(() => {
    const raw = searchParams?.get("page") || "1";
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 1;
  }, [searchParams]);
  const page = useMemo(() => {
    const raw = searchParams?.get("page") || "1";
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 1;
  }, [searchParams]);

  const setPageInUrl = useCallback(
    (n: number) => {
      const sp = new URLSearchParams(searchParams?.toString());
      sp.set("page", String(n));
      router.replace(`?${sp.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const eventsQuery = useEventsDropdown();
  const events = eventsQuery.data?.data || [];

  const juriesQuery = useJuryInvitations({
    eventId: selectedEventKey ? Number(selectedEventKey) : undefined,
    page,
    limit: rowsPerPage,
  });

  const invitations = juriesQuery.data?.invitations ?? [];
  const meta = juriesQuery.data?.meta;
  const isLoading = juriesQuery.isLoading || eventsQuery.isLoading;

  const getStatusColor = (status: InvitationStatus) => {
    switch (status) {
      case 1: // ACCEPTED
        return "success";
      case 2: // DECLINED
        return "danger";
      case 0: // PENDING
        return "warning";
      case 3: // EXPIRED
        return "default";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: InvitationStatus) => {
    switch (status) {
      case 1:
        return "Aceptado";
      case 2:
        return "Rechazado";
      case 0:
        return "Pendiente";
      case 3:
        return "Expirado";
      default:
        return "Desconocido";
    }
  };

  const onSearchChange = useCallback(
    (value?: string) => {
      if (value) {
        setFilterValue(value);
        setPageInUrl(1);
      } else {
        setFilterValue("");
      }
    },
    [setPageInUrl]
  );
  const setPageInUrl = useCallback(
    (n: number) => {
      const sp = new URLSearchParams(searchParams?.toString());
      sp.set("page", String(n));
      router.replace(`?${sp.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const eventsQuery = useEventsDropdown();
  const events = eventsQuery.data?.data || [];

  const juriesQuery = useJuryInvitations({
    eventId: selectedEventKey ? Number(selectedEventKey) : undefined,
    page,
    limit: rowsPerPage,
  });

  const invitations = juriesQuery.data?.invitations ?? [];
  const meta = juriesQuery.data?.meta;
  const isLoading = juriesQuery.isLoading || eventsQuery.isLoading;

  const getStatusColor = (status: InvitationStatus) => {
    switch (status) {
      case 1: // ACCEPTED
        return "success";
      case 2: // DECLINED
        return "danger";
      case 0: // PENDING
        return "warning";
      case 3: // EXPIRED
        return "default";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: InvitationStatus) => {
    switch (status) {
      case 1:
        return "Aceptado";
      case 2:
        return "Rechazado";
      case 0:
        return "Pendiente";
      case 3:
        return "Expirado";
      default:
        return "Desconocido";
    }
  };

  const onSearchChange = useCallback(
    (value?: string) => {
      if (value) {
        setFilterValue(value);
        setPageInUrl(1);
      } else {
        setFilterValue("");
      }
    },
    [setPageInUrl]
  );

  const onClear = useCallback(() => {
    setFilterValue("");
    setPageInUrl(1);
  }, [setPageInUrl]);

  const filteredInvitations = useMemo(() => {
    if (!filterValue) return invitations;
    return invitations.filter((inv) =>
      inv.email.toLowerCase().includes(filterValue.toLowerCase())
    );
  }, [invitations, filterValue]);

  const hasSearchFilter = Boolean(filterValue);
  const pages = meta?.totalPages ?? 1;
  const totalItems = meta?.total ?? 0;

  const topContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-3 items-end">
          <Input
            isClearable
            className="w-full sm:max-w-[44%]"
            placeholder="Buscar por correo…"
            startContent={<SearchIcon />}
            value={filterValue}
            onClear={onClear}
            onValueChange={onSearchChange}
          />
          <div className="flex gap-3">
            <Select
              label="Evento"
              placeholder="Selecciona un evento"
              className="w-64"
              selectedKeys={selectedEventKey ? [selectedEventKey] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0];
                setSelectedEventKey(selected ? String(selected) : "");
                setPageInUrl(1);
              }}
              isLoading={eventsQuery.isLoading}
            >
              {events.map((event) => (
                <SelectItem key={String(event.id)}>{event.name}</SelectItem>
              ))}
            </Select>
            <InviteModal />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small">
            {selectedEventKey
              ? hasSearchFilter
                ? `${filteredInvitations.length} resultados (filtrados de ${totalItems})`
                : `${totalItems} invitaciones`
              : "Selecciona un evento para ver las invitaciones"}
          </span>
        </div>
      </div>
    );
  }, [
    filterValue,
    onSearchChange,
    onClear,
    hasSearchFilter,
    totalItems,
    selectedEventKey,
    events,
    eventsQuery.isLoading,
    filteredInvitations.length,
    setPageInUrl,
  ]);

  const bottomContent = useMemo(() => {
    if (!selectedEventKey) return null;

    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <Pagination
          isCompact
          showControls
          showShadow
          color="primary"
          page={page}
          total={pages}
          onChange={(n) => setPageInUrl(n)}
        />
        <div className="hidden sm:flex w-[30%] justify-end gap-2">
          <Button
            isDisabled={page === 1}
            size="sm"
            variant="flat"
            onPress={() => setPageInUrl(Math.max(1, page - 1))}
          >
            Anterior
          </Button>
          <Button
            isDisabled={page === pages}
            size="sm"
            variant="flat"
            onPress={() => setPageInUrl(Math.min(pages, page + 1))}
          >
            Siguiente
          </Button>
        </div>
      </div>
    );
  }, [page, pages, setPageInUrl, selectedEventKey]);

  const columns = [
    { key: "email", label: "Correo" },
    { key: "event", label: "Evento" },
    { key: "status", label: "Estado" },
    { key: "expiresAt", label: "Expira" },
    { key: "createdAt", label: "Fecha de invitación" },
    { key: "actions", label: "Acciones" },
  ];

  return (
    <Table
      aria-label="Lista de invitaciones de jurados"
      topContent={topContent}
      topContentPlacement="outside"
      bottomContent={bottomContent}
      bottomContentPlacement="outside"
      classNames={{ wrapper: "min-h-[382px] glass-card" }}
      selectionMode="none"
    >
      <TableHeader columns={columns}>
        {(column) => (
          <TableColumn key={column.key} align="center">
            {column.label}
          </TableColumn>
        )}
      </TableHeader>

      <TableBody
        emptyContent={
          isLoading
            ? undefined
            : !selectedEventKey
              ? "Selecciona un evento para ver las invitaciones"
              : "No hay invitaciones para este evento"
        }
        items={isLoading ? [] : filteredInvitations}
      >
        {isLoading ? (
          <TableRow key="loading">
            <TableCell
              align="center"
              className="py-10"
              colSpan={columns.length}
            >
              <Spinner size="lg" />
            </TableCell>
          </TableRow>
        ) : (
          (item) => (
            <TableRow key={item.id}>
              <TableCell align="center">{item.email}</TableCell>
              <TableCell align="center">{item.event?.name || "—"}</TableCell>
              <TableCell align="center">
                <Chip
                  className="w-full capitalize"
                  color={getStatusColor(item.status)}
                  size="sm"
                >
                  {getStatusLabel(item.status)}
                </Chip>
              </TableCell>
              <TableCell align="center">
                {item.expiresAt
                  ? new Date(item.expiresAt).toLocaleDateString("es-CO", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
              </TableCell>
              <TableCell align="center">
                {item.createdAt
                  ? new Date(item.createdAt).toLocaleDateString("es-CO", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
              </TableCell>
              <TableCell align="center">
                <div className="flex items-center justify-center gap-2">
                  {item.status === 0 && (
                    <>
                      <AcceptInvitationModal invitation={item} />
                      <ResendInvitationButton invitation={item} />
                    </>
                  )}
                  {item.status === 3 && (
                    <ResendInvitationButton invitation={item} />
                  )}
                </div>
              </TableCell>
            </TableRow>
          )
        )}
      </TableBody>
    </Table>
  );
};
