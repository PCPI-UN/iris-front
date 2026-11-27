import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { CheckCircle2, FileText, MapPin, Users } from "lucide-react";
import { AvatarGroup } from "@/features/projects/components/avatar-icon";
import { useRouter } from "next/navigation";
import { paths } from "@/config/paths";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@/components/ui/dropdown";
import { ChevronDown, ExternalLink } from "lucide-react";
import { documentLink, type DocumentRef } from "@/lib/document-link";
import { formatPoints } from "@/features/grading-scales/utils/grading-scale";
import { buildTourUrl, navigateToTour } from "../utils/tour-url";

type ProjectCardProps = {
    project: any;
    showProjectCode?: boolean;
    /** Highest grade of the event's scale, to show the juror's grade as "4.2 / 5" */
    maxGrade?: number;
    departmentName?: string | null;
    termCode?: string | null;
};

export function ProjectCard({
    project,
    showProjectCode = false,
    maxGrade,
    departmentName,
    termCode,
}: ProjectCardProps) {
    const router = useRouter();
    const documents = project?.documents ?? [];

      const openDocument = (doc?: DocumentRef) => {
    if (!doc) return
    window.open(documentLink(doc), "_blank", "noopener,noreferrer")
  }

  const getDocumentLabel = (doc: any, index: number) => {
    const explicitName = String(doc?.name ?? "").trim()

    if (explicitName) return explicitName
    if (doc?.type === "POSTER") return "Póster"
    if (doc?.type === "ASSOCIATED_DOCUMENT") return "Documento asociado"

    return `Documento ${index + 1}`
  }

    const resolvedDepartmentName =
        departmentName ?? project?.academicCourse?.departmentName ?? null;
    const resolvedTermCode = termCode ?? project?.academicCourse?.term ?? null;
    const hasTourInfo = Boolean(
        buildTourUrl({
            termCode: resolvedTermCode,
            departmentName: resolvedDepartmentName,
            projectCode: project?.projectCode,
            projectId: project?.id,
            origin: "https://iris.local",
        }),
    );

    const openTour = () => {
        if (typeof window === "undefined") return;
        const tourUrl = buildTourUrl({
            termCode: resolvedTermCode,
            departmentName: resolvedDepartmentName,
            projectCode: project?.projectCode,
            projectId: project?.id,
            origin: window.location.origin,
        });
        if (!tourUrl) return;
        navigateToTour(tourUrl);
    };

    const projectLabel = showProjectCode ? project.projectCode || null : null;
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
                                        onPress={() => openDocument(documents[0])}
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
                                                openDocument(selectedDocument)
                                            }}
                                        >
                                            {documents.map((doc: any, index: number) => (
                                                <DropdownItem
                                                    key={String(index)}
                                                    startContent={<FileText className="h-4 w-4 text-primary" />}
                                                    description={doc?.type}
                                                    className="data-[hover=true]:bg-primary/10 w-[full] truncate"
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

                    {project.evaluated && typeof project.evaluation?.grade === "number" && (
                        <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-success" />
                            <span className="font-medium">Tu nota:</span>
                            <span className="font-semibold">
                                {formatPoints(project.evaluation.grade)}
                                {maxGrade !== undefined ? ` / ${formatPoints(maxGrade)}` : ""}
                            </span>
                        </div>
                    )}

                    {/* An evaluated project opens its evaluation read-only; Tour renders 50/50 only when department and projectCode exist */}
                    <div
                        className={
                            hasTourInfo
                                ? "mt-6 grid grid-cols-2 gap-3"
                                : "mt-6"
                        }
                    >
                        <Button
                            className="w-full min-w-0 transition-transform"
                            color="primary"
                            variant={project.evaluated ? "bordered" : "solid"}
                            onPress={() => router.push(paths.app.evaluations.getHref(project.id))}
                        >
                            {project.evaluated
                                ? "Ver evaluación"
                                : (showProjectCode ? "Evaluar Proyecto" : "Evaluar Equipo")}
                        </Button>

                        {hasTourInfo && (
                            <Button
                                className="w-full min-w-0 border border-secondary/30 transition-transform"
                                color="secondary"
                                startContent={<MapPin className="h-4 w-4 shrink-0" />}
                                variant="flat"
                                onPress={openTour}
                            >
                                Tour
                            </Button>
                        )}
                    </div>
                </div>
            </CardBody>
        </Card>
    );
}
