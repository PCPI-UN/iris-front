import { Column } from "@/components/data-table";
import { StatusBadge } from "@/components/ui/status-badge/status-badge";
import { Project } from "@/types/api";
import { Button } from "@/components/ui/button";
import { EyeIcon, UserRoundPlus } from "lucide-react";

export const columnsProject = ({onSelectProject, onViewProject}: { onSelectProject: (project: any) => void; onViewProject: (project: any) => void; }): Column<any>[] => {
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
      title: "Asignaciones",
      field: "assigned",
      Cell: ({entry}) => (
          <>
              {entry.assigned && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {entry.assigned}
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
      
      <div className="flex">
        <Button
          size="sm"
          variant="light"
          onPress={ () => onViewProject(entry) }
        >
          <EyeIcon width={20}/>
        </Button>
        <Button
          size="sm"
          variant="light"
          onPress={ () => onSelectProject(entry) }
        >
          <UserRoundPlus width={20}/>
        </Button>
      </div>
    )},
  ]
}