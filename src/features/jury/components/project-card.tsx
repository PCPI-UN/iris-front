import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { FileText, Users } from "lucide-react";
import { AvatarGroup } from "@/features/projects/components/avatar-icon";
import { useRouter } from "next/navigation";
import { paths } from "@/config/paths";
import { Chip } from "@heroui/chip";

export function ProjectCard({ project }: { project: any }) {
    const router = useRouter();
    return (
        <Card
            className="glass-card w-full rounded-xl border border-default-200 hover:border-primary transition-all duration-150 hover:scale-[1.01]"
        >
            <CardBody className="p-6">
                <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center justify-between gap-2">
                                <h3 className="text-lg font-semibold text-balance">
                                    {project.name}
                                </h3>

                                {project.eventNumber && (
                                    <Chip size="sm" variant="flat">
                                        #{project.eventNumber}
                                    </Chip>
                                )}
                            </div>

                            {project.description && (
                                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                                    {project.description.length > 200
                                        ? `${project.description.slice(0, 200)}...`
                                        : project.description}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3 md:space-y-4">
                        <div className="flex items-center gap-2 text-xs md:text-sm">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Integrantes del equipo</span>
                        </div>

                        <div className="hidden sm:block">
                            <AvatarGroup
                                participants={
                                    project.pendingParticipants?.length > 0
                                        ? project.pendingParticipants
                                            .filter((p: any) => p?.firstName && p?.lastName)
                                            .map((p: any) => ({
                                                name: `${String(p.firstName ?? "").trim()} ${String(p.lastName ?? "").trim()}`.trim(),
                                            }))
                                        : project.participants
                                            ?.filter((p: any) => p?.firstName && p?.lastName)
                                            .map((p: any) => ({
                                                name: `${String(p.firstName ?? "").trim()} ${String(p.lastName ?? "").trim()}`.trim(),
                                            })) ?? []
                                }
                                size={35}
                            />
                        </div>

                        <div className="sm:hidden space-y-2">
                            {(project.pendingParticipants?.length > 0
                                ? project.pendingParticipants
                                : project.participants
                            )
                                ?.filter((p: any) => p?.firstName && p?.lastName)
                                .map((participant: any, idx: number) => {
                                    const firstName = String(participant.firstName ?? "").trim();
                                    const lastName = String(participant.lastName ?? "").trim();
                                    
                                    if (!firstName || !lastName) return null;
                                    
                                    return (
                                        <div key={idx} className="flex items-center gap-2 text-sm">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                                                {firstName[0]}
                                                {lastName[0]}
                                            </div>
                                            <span>
                                                {firstName} {lastName}
                                            </span>
                                        </div>
                                    );
                                })
                                .filter(Boolean)}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>Documents: {project.documents?.length || 0} file(s) attached</span>
                    </div>

                    <Button
                        className="mt-6 w-full transition-transform hover:scale-[1.01]"
                        color="primary"
                        onPress={() => router.push(paths.app.evaluations.getHref(project.id))}
                        isDisabled={project.evaluated}
                    >
                        {project.evaluated ? "Evaluado" : "Evaluar Proyecto"}
                    </Button>
                </div>
            </CardBody>
        </Card>
    );
}
