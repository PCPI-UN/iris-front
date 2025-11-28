import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Users } from "lucide-react";
import { AvatarGroup } from "@/features/projects/components/avatar-icon";
import { useRouter } from "next/navigation";
import { paths } from "@/config/paths";

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
                            <h3 className="text-lg font-semibold text-balance">{project.name}</h3>
                            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                                {project.description.length > 200
                                    ? project.description.slice(0, 200) + "…"
                                    : project.description
                                }
                            </p>

                        </div>
                    </div>

                    <div className="space-y-3 md:space-y-4">
                        <div className="flex items-center gap-2 text-xs md:text-sm">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Miembros</span>
                        </div>

                        <AvatarGroup
                            participants={project.participants || []}
                            size={35}
                        />
                    </div>

                    <Button
                        onPress={() => router.push(paths.app.evaluations.getHref(project.id))}
                        color="primary"
                        className={`
                            w-full
    transition-transform
    ${project.evaluated ? "opacity-70 cursor-not-allowed bg-default-200 dark:bg-default-100" : "hover:scale-[1.01]"}
    md:text-base text-sm
    md:py-3 py-2
    rounded-xl
    font-medium
  `}
                        isDisabled={project.evaluated}
                    >
                        {project.evaluated ? "Evaluado" : "Evaluar Proyecto"}
                    </Button>


                </div>
            </CardBody>
        </Card>
    );
}
