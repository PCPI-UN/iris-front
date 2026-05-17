import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { FileText, Users } from "lucide-react";
import { AvatarGroup } from "@/features/projects/components/avatar-icon";
import { useRouter } from "next/navigation";
import { paths } from "@/config/paths";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@/components/ui/dropdown";
import { ChevronDown, ExternalLink } from "lucide-react";

export function ProjectCard({ project, showProjectCode = false }: { project: any; showProjectCode?: boolean }) {
    const router = useRouter();
    const documents = project?.documents ?? [];

      const openDocument = (url?: string) => {
    if (!url) return
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const getDocumentLabel = (doc: any, index: number) => {
    const explicitName = String(doc?.name ?? "").trim()

    if (explicitName) return explicitName
    if (doc?.type === "POSTER") return "Póster"
    if (doc?.type === "ASSOCIATED_DOCUMENT") return "Documento asociado"

    return `Documento ${index + 1}`
  }

    const projectLabel =
                (showProjectCode
                        ? project.projectCode ||
                            project._projectCode ||
                            project.data?.projectCode ||
                            project.data?._projectCode
                        : null) || null;
    return (
        <Card
            className="glass-card w-full rounded-xl border border-default-200 hover:border-primary transition-all duration-150 hover:scale-[1.01]"
        >
            <CardBody className="p-6">
                <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex min-w-0 flex-1 items-start gap-4">
                            {showProjectCode && projectLabel ? (
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-2xl font-semibold text-primary">
                                    {projectLabel}
                                </div>
                            ) : null}

                            <div className="min-w-0 flex-1">
                                <h3 className="text-lg font-semibold text-balance">
                                    {project.name}
                                </h3>

                                {project.description && (
                                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                                        {project.description.length > 200
                                            ? `${project.description.slice(0, 200)}...`
                                            : project.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 md:space-y-4">
                        <div className="flex items-center gap-2 text-xs md:text-sm">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Integrantes del equipo</span>
                            {showProjectCode && project.projectCode ? (
                                <p className="ml-auto text-xs text-muted-foreground">
                                    {`Código: ${project.projectCode}`}
                                </p>
                            ) : null}
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

                    <div className="space-y-3 md:space-y-4">
                        {documents.length > 0 && (
                            <div className="space-y-2 pt-2 md:pt-4 border-t border-border">
                                <div className="flex items-center gap-2 text-xs md:text-sm">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">Documentos ({documents.length})</span>
                                </div>

                                {documents.length === 1 ? (
                                    <Button
                                        variant="flat"
                                        className="w-full justify-between gap-3 border border-default-200 bg-default-50/60 text-left"
                                        onPress={() => openDocument(documents[0]?.url)}
                                    >
                                        <span className="flex min-w-0 items-center gap-2 text-xs md:text-sm">
                                            <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                                            <span className="truncate font-medium">
                                                {getDocumentLabel(documents[0], 0)}
                                            </span>
                                        </span>
                                        <ExternalLink className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                    </Button>
                                ) : (
                                    <Dropdown placement="bottom-start" shouldBlockScroll={false}>
                                        <DropdownTrigger>
                                            <Button
                                                variant="flat"
                                                className="w-full justify-between gap-3 border border-default-200 bg-default-50/60"
                                                endContent={<ChevronDown className="h-4 w-4" />}
                                            >
                                                <span className="flex min-w-0 items-center gap-2 text-xs md:text-sm">
                                                    <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                                                    <span className="truncate font-medium">Abrir documentos</span>
                                                </span>
                                            </Button>
                                        </DropdownTrigger>
                                        <DropdownMenu
                                            aria-label="Documentos del proyecto"
                                            onAction={(key) => {
                                                const selectedDocument = documents[Number(key)]
                                                openDocument(selectedDocument?.url)
                                            }}
                                        >
                                            {documents.map((doc: any, index: number) => (
                                                <DropdownItem
                                                    key={String(index)}
                                                    startContent={<FileText className="h-4 w-4 text-primary" />}
                                                    description={doc?.type}
                                                    className="data-[hover=true]:bg-primary/10"
                                                >
                                                    {getDocumentLabel(doc, index)}
                                                </DropdownItem>
                                            ))}
                                        </DropdownMenu>
                                    </Dropdown>
                                )}
                            </div>
                        )}
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
