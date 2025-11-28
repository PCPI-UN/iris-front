"use client"

import { Card, CardBody } from "@/components/ui/card"
import { FileText, Users, ArrowLeft } from "lucide-react"
import { Button } from "@heroui/button"
import { paths } from "@/config/paths"
import { useJuryProjects } from "@/features/projects-public/api/get-jury-project"
import { Spinner } from "@/components/ui/spinner"
import { AvatarGroup } from "@/features/projects/components/avatar-icon"
import { useRouter } from "next/navigation"
import { useUser } from "@/lib/auth"

type ProjectListViewProps = {
  eventId: string;
};

export function ProjectListView({ eventId }: ProjectListViewProps) {
  const router = useRouter();

  const eventsQuery = useJuryProjects({
      page: 1,
      eventId: Number(eventId),
    });

  const projects = eventsQuery.data?.data || [];
  const isLoading = eventsQuery.isLoading;

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
                  {/* {project.eventNumber && (
                    <div className="flex-shrink-0">
                      <span className="text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary">
                        #{project.eventNumber}
                      </span>
                    </div>
                  )} */}
                </div>

                <div className="space-y-3 md:space-y-4">
                  <div className="flex items-center gap-2 text-xs md:text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Miembros</span>
                  </div>

                  {/* <div className="flex flex-wrap gap-2">
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
                  </div> */}
                </div>

                {/* <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>Documents: {project.documents?.length || 0} file(s) attached</span>
                </div> */}
              </div>
              <Button
                className="mt-6 w-full transition-transform hover:scale-[1.01]"
                color="primary"
                onPress={() => router.push(paths.app.evaluations.getHref(project.id))}
              >Evaluate Project</Button>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  )
}
