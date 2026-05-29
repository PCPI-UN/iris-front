import { Column } from "@/components/data-table";
import { StatusBadge } from "@/components/ui/status-badge/status-badge";
import { Project } from "@/types/api";
import { MoreVertical } from "lucide-react";
import { ViewDetails } from "./view-details";
import { useProject } from "../api/get-project";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@/components/ui/dropdown";
import { Button } from "@/components/ui/button";

const ProjectActions = ({ project, onApprove, onReject, onRequest }: {
  project: Project;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  onRequest: (id: number) => void;
}) => {
  const shouldFetchReason =
    (project.state === "REJECTED" || project.state === "REQUEST_CHANGES") &&
    !project.reason?.trim();

  const projectQuery = useProject({
    projectId: String(project.id),
    queryConfig: {
      enabled: shouldFetchReason,
    },
  });

  const reason =
    project.reason?.trim() ||
    projectQuery.data?.reason?.trim() ||
    (projectQuery.isLoading ? "Cargando motivo..." : "Sin motivo registrado");

  return (
    <Dropdown closeOnSelect={false}>
      <DropdownTrigger>
        <Button isIconOnly variant="light">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownTrigger>

      <DropdownMenu
        aria-label="Acciones del proyecto"
        className="w-fit min-w-48 max-w-[calc(100vw-2rem)] sm:max-w-xl"
      >
        {project.state === "UNDER_REVIEW" ? (
          <>
            <DropdownItem key="request" onPress={() => onRequest(project.id)}>
              Pedir cambios
            </DropdownItem>

            <DropdownItem key="reject" color="danger" onPress={() => onReject(project.id)}>
              Rechazar
            </DropdownItem>

            <DropdownItem key="approve" onPress={() => onApprove(project.id)}>
              Aprobar
            </DropdownItem>
          </>
        ) : project.state === "APPROVED" ? (
          <DropdownItem
            key="approved"
            isDisabled
            className="h-auto items-start py-2 text-sm leading-5 text-foreground"
          >
            <div className="whitespace-normal break-words text-left">Aprobado</div>
          </DropdownItem>
        ) : (
          <DropdownItem
            key="reason"
            isDisabled
            className="h-auto items-start py-2 text-sm leading-5 text-foreground"
          >
            <div className="max-w-[min(36rem,calc(100vw-4rem))] whitespace-normal break-words text-left">
              {reason}
            </div>
          </DropdownItem>
        )}
      </DropdownMenu>
    </Dropdown>
  );
};

export const columnsProject = ({onApprove, onReject, onRequest}: {onApprove: (id: number) => void; onReject: (id: number) => void; onRequest: (id: number) => void;}): Column<Project>[] => {
return [
  {
    title: "Código",
    field: "projectCode",
    sortable: true,
    Cell: ({ entry }) => (
      <span className="text-sm text-muted-foreground">
        {entry.projectCode ?? "—"}
      </span>
    ),
  },
  {
    title: "Proyecto",
    field: "name",
    Cell: ({ entry }) => (
      <div>
        <h3 className="font-semibold">{entry.name}</h3>
      </div>
    ),
  },
  {
    title: "Estado",
    field: "state",
    Cell: ({ entry }) => (
      <StatusBadge state={entry.state} />
    ),
  },
  {
  title: "Acciones",
  field: "actions",
  Cell: ({ entry }) => (
    <ProjectActions
      project={entry}
      onApprove={onApprove}
      onReject={onReject}
      onRequest={onRequest}
    />
  )},
  {
    title: "Ver",
    field: "id",
    Cell: ({ entry }) => (
      <div className="flex flex-wrap gap-2">     
        <ViewDetails project={entry} />
      </div>
    ),
  },
]}