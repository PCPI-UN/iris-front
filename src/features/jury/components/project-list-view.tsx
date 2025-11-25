"use client"

import { Card, CardBody } from "@/components/ui/card"
import { FileText, Users, ArrowLeft } from "lucide-react"
import { Button } from "@heroui/button"
import { paths } from "@/config/paths"
import { useJuryProjects } from "@/features/projects-public/api/get-jury-project"
import { Spinner } from "@/components/ui/spinner"
import { AvatarGroup } from "@/features/projects/components/avatar-icon"
import { useRouter } from "next/navigation"

const MOCK_PROJECTS = [
  {
    id: "p1",
    name: "Sistema de Monitoreo Ambiental con IoT",
    description:
      "Proyecto enfocado en medir calidad de aire, ruido y temperatura usando sensores IoT conectados a la nube.",
    participants: [
      { firstName: "María", lastName: "González" },
      { firstName: "Carlos", lastName: "Rodríguez" },
      { firstName: "Ana", lastName: "Martínez" },
    ],
  documents: [
    { id: "1", type: "POSTER", url: "#", name: "Póster del Proyecto" },
    { id: "2", type: "ASSOCIATED_DOCUMENT", url: "#", name: "Documento Técnico" },
    { id: "3", type: "ASSOCIATED_DOCUMENT", url: "#", name: "Manual de Usuario" },
    ],
    eventNumber: 12,
  },
  {
    id: "p2",
    name: "Robot Autónomo para Búsqueda y Rescate",
    description:
      "Robot diseñado para identificar víctimas en zonas de riesgo utilizando visión artificial y mapeo 3D.",
    participants: [
      { firstName: "Sofía", lastName: "Ramírez" },
      { firstName: "Diego", lastName: "Pérez" },
    ],
    documents: [
      { id: "3", type: "POSTER", url: "#", name: "Póster del Robot" },
    ],
    eventNumber: 7,
  },
  {
    id: "p3",
    name: "Aplicación de Energía Solar Inteligente",
    description:
      "Sistema que optimiza el uso de paneles solares mediante análisis predictivo y monitoreo en tiempo real.",
    participants: [
      { firstName: "Luis", lastName: "Torres" },
      { firstName: "Camila", lastName: "Hernández" },
      { firstName: "Javier", lastName: "Mendoza" },
    ],
    documents: [],
    eventNumber: 21,
  },
];


type ProjectListViewProps = {
    eventId: string;
};

export function ProjectListView({ eventId }: ProjectListViewProps) {
    const router = useRouter();

    // const { data, isLoading } = useJuryProjects({
    //     page: 1,
    //     eventId: eventId,
    // });

    //const projects = data?.data || [];
    const projects = MOCK_PROJECTS;
    const isLoading = false;

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Spinner size="lg" />
            </div>
        )
    }

    if (projects.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                No hay proyectos asignados
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div>
                <Button
                    variant="light"
                    className="gap-2"
                    onClick={() => router.push('/app')}
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Button>
            </div>
            <div className="grid gap-6 p-4 sm:grid-cols-1 lg:grid-cols-2">
                {projects.map((project) => (
                    <Card
                        key={project.id}
                        className="glass-card w-full rounded-xl border border-default-200 hover:border-primary transition-all duration-150 hover:scale-[1.01]"
                    >
                        <CardBody className="p-6">
                            <div className="space-y-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-balance">{project.name}</h3>
                                        {project.description && (
                                            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{project.description}</p>
                                        )}
                                    </div>
                                    {project.eventNumber && (
                                        <div className="flex-shrink-0">
                                            <span className="text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary">
                                                #{project.eventNumber}
                                            </span>
                                        </div>
                                    )}
                                </div>

                 <div className="space-y-3 md:space-y-4">
                   <div className="flex items-center gap-2 text-xs md:text-sm">
                     <Users className="h-4 w-4 text-muted-foreground" />
                     <span className="font-medium">Miembros</span>
                   </div>
 
                   <div className="flex flex-wrap gap-2">
                     {project.participants.map((participant, idx) => (
                       <div
                         key={idx}
                         className="flex items-center gap-2 bg-muted/10 rounded-full pr-3 py-1"
                         title={`${participant.firstName} ${participant.lastName}`}
                       >
                         <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs md:text-sm flex-shrink-0">
                           {participant.firstName[0]}
                           {participant.lastName[0]}
                         </div>
                         <span className="text-xs md:text-sm font-medium">
                           {participant.firstName} {participant.lastName}
                         </span>
                       </div>
                     ))}
                   </div>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <FileText className="h-4 w-4" />
                                    <span>Documents: {project.documents?.length || 0} file(s) attached</span>
                                </div>
                            </div>
                            <Button
                                className="mt-6 w-full transition-transform hover:scale-[1.01]"
                                color="primary"
                                onPress={() => router.push(paths.app.test.getHref())}
                            >Evaluate Project</Button>
                        </CardBody>
                    </Card>
                ))}
            </div>
        </div>
    )
}
