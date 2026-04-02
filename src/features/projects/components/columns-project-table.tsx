import { Column } from "@/components/data-table";
import { StatusBadge } from "@/components/ui/status-badge/status-badge";
import { Project } from "@/types/api";
import { MoreVertical } from "lucide-react";
import { ViewDetails } from "./view-details";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@/components/ui/dropdown";
import { Button } from "@/components/ui/button";

export const columnsProject = ({onApprove, onReject, onRequest}: {onApprove: (id: number) => void; onReject: (id: number) => void; onRequest: (id: number) => void;}): Column<Project>[] => {

const getActions = (entry: Project) => {
  switch (entry.state) {
    case "UNDER_REVIEW":
      return [
        <DropdownItem key="request" onPress={() => onRequest(entry.id)}>
          Pedir cambios
        </DropdownItem>,

        <DropdownItem key="reject" color="danger" onPress={() => onReject(entry.id)}>
          Rechazar
        </DropdownItem>,

        <DropdownItem key="approve" onPress={() => onApprove(entry.id)}>
          Aprobar
        </DropdownItem>
      ]
    case "REQUEST_CHANGES":
      return [
        <DropdownItem key="approve" onPress={() => onApprove(entry.id)}>
          Aprobar
        </DropdownItem>,
        
        <DropdownItem key="reject" color="danger" onPress={() => onReject(entry.id)}>
          Rechazar
        </DropdownItem>
      ]
    case "REJECTED":
      return [
        <DropdownItem key="request" onPress={() => onRequest(entry.id)}>
          Pedir cambios
        </DropdownItem>,

        <DropdownItem key="approve" onPress={() => onApprove(entry.id)}>
          Aprobar
        </DropdownItem>,
      ]
    case "APPROVED":
      return [
        <DropdownItem key="request" onPress={() => onRequest(entry.id)}>
          Pedir cambios
        </DropdownItem>,

        <DropdownItem key="reject" color="danger" onPress={() => onReject(entry.id)}>
          Rechazar
        </DropdownItem> 
      ]
  }
}

return [
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
    title: "Descripción",
    field: "description",
    Cell: ({entry}) => (
        <>
            {entry.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {entry.description}
          </p>
        )}
        </>
    )
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
    <Dropdown closeOnSelect={false}>
      <DropdownTrigger>
        <Button isIconOnly variant="light">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownTrigger>

      <DropdownMenu aria-label="Acciones del proyecto">
        {getActions(entry)}        
      </DropdownMenu>
    </Dropdown>
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