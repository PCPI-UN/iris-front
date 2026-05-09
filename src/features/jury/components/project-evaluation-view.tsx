"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardBody, CardHeader } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal"
import { FileText, Users, Send, ArrowLeft, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { useProject } from "@/features/projects/api/get-project"
import { AvatarGroup } from "@/features/projects/components/avatar-icon"
import { useCategoryCriteria } from "@/features/criteria/api/get-category-criterion"
import { useCreateEvaluation } from "@/features/evaluations/api/create-evaluation"
import { useNotifications } from "@/components/ui/notifications"
import { Spinner } from "@heroui/spinner"
import { normalizeCategoryId } from "@/lib/compat/category-legacy"

const SCORE_SCALE = [
  { value: 1, label: "Insuficiente" },
  { value: 2, label: "Aceptable" },
  { value: 3, label: "Bueno" },
  { value: 4, label: "Excelente" },
]

type ProjectEvaluationViewProps = {
  projectId: string
}

export function ProjectEvaluationView({ projectId }: ProjectEvaluationViewProps) {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(0)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [comments, setComments] = useState("")
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { addNotification } = useNotifications();
  const { mutate, isPending } = useCreateEvaluation({
    mutationConfig: {
      onSuccess: () => {
        addNotification({
          type: "success",
          title: "Evaluación enviada exitosamente",
        });
        setIsSubmitting(false);
        router.push(`/app/events/${project.eventId}`);
      },
      onError: () => {
        setIsSubmitting(false);
      },
    },
  });

  const { data: projectData, isLoading: isProjectLoading } = useProject({ projectId });

  const project = (projectData as any)?.data ?? projectData ?? null;
  const projectCategoryId = normalizeCategoryId(project ?? {}) ?? "";

  const {
    data: categoryCriteriaData,
    isLoading: isCategoryCriteriaLoading,
  } = useCategoryCriteria({
    categoryId: String(projectCategoryId),
    queryConfig: {
      enabled: !!projectCategoryId,
    },
  });

  if (isProjectLoading || isCategoryCriteriaLoading) {
    return (     
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  const backendSections =
    categoryCriteriaData?.map((cat, index) => ({
      id: `section-${index + 1}`,
      name: `${index + 1}. (${cat.weight}) ${cat.category}`,
      isSection: true,
      subcriteria: cat.criterions.map((c) => ({
        id: c.id.toString(),
        name: c.name,
        weight: cat.weight,
      })),
    })) ?? [];


  const allSections = backendSections
  const currentSection = allSections[currentPage]

  const handleScoreChange = (criterionId: string, value: number) => {
    setScores((prev) => ({
      ...prev,
      [criterionId]: value,
    }))
  }

  const handleSubmit = () => {
    if (isSubmitting) return

    const hasAnyScore = Object.keys(scores).length > 0
    if (!hasAnyScore) {
      alert("Por favor, proporcione calificaciones antes de enviar")
      return
    }

    setIsConfirmModalOpen(true)
  }

  const handleConfirmSubmit = () => {
    setIsConfirmModalOpen(false);
    setIsSubmitting(true);

    const payload: any = {
      projectId: Number(projectId),
      scores: Object.entries(scores).map(([localId, value]) => ({
        criterionId: Number(localId),
        score: value,
      })),
    };

    if (comments.trim()) {
      payload.comments = comments.trim();
    }

    mutate({ data: payload });
  };



  const handleGoBack = () => {
    if (project?.eventId) {
      router.push(`/app/events/${project.eventId}`)
    } else {
      router.push("/app")
    }
  }

  const canGoNext = currentPage < allSections.length - 1
  const canGoPrevious = currentPage > 0

  return (
    <div className="space-y-4">
      <div>
        <Button
          variant="light"
          className="gap-2"
          onClick={handleGoBack}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Project Details Card */}
        <Card className="glass-card border-border bg-card h-fit">
          <CardBody className="p-4 md:p-6">
            <div className="space-y-4 md:space-y-6">
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-balance">{project?.name}</h2>
                <p className="mt-2 text-xs md:text-sm text-muted-foreground leading-relaxed">
                  {project?.description}
                </p>
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
                              name: `${String(p.firstName ?? "").trim()} ${String(p.lastName ?? "").trim()}`.trim()
                            }))
                        : project.participants
                            ?.filter((p: any) => p?.firstName && p?.lastName)
                            .map((p: any) => ({
                              name: `${String(p.firstName ?? "").trim()} ${String(p.lastName ?? "").trim()}`.trim()
                            })) ?? []
                    }
                    size={35}
                  />
                </div>

                {/* Mobile: Lista de nombres */}
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
                          <span>{firstName} {lastName}</span>
                        </div>
                      );
                    })
                    .filter(Boolean)}
                </div>
              </div>

              {project.documents && project.documents.length > 0 && (
                <div className="space-y-2 pt-2 md:pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-xs md:text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Documentos</span>
                  </div>

                  <div className="space-y-2 md:space-y-3">
                    {project.documents.map((doc: any) => {
                      const readableType =
                        doc.type === "POSTER"
                          ? "Póster"
                          : doc.type === "ASSOCIATED_DOCUMENT"
                            ? "Documento asociado"
                            : doc.type

                      return (
                        <div
                          key={doc.id}
                          className="w-full flex items-center justify-between p-2 md:p-3 rounded-lg border border-muted/20 bg-muted/5 hover:bg-muted/10 transition-colors cursor-pointer"
                          onClick={() => window.open(doc.url, "_blank")}
                        >
                          <div className="flex items-center gap-2 text-xs md:text-sm min-w-0">
                            <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                            <span className="font-medium truncate">{readableType}</span>
                          </div>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-muted-foreground flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 7l5 5m0 0l-5 5m5-5H6"
                            />
                          </svg>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        <Card className="glass-card border-border bg-card">
          <CardHeader className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-base md:text-lg font-semibold">
                  Evaluación Póster - Proyecto Final de Ingenierías
                </p>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">
                  Sección {currentPage + 1} de {allSections.length}
                </p>

              </div>
            </div>
          </CardHeader>
          <CardBody className="space-y-6 md:space-y-8 p-4 md:p-6">
            {/* Título de la sección */}
            <div className="border-b border-border pb-3">
              <h3 className="text-base md:text-lg font-semibold text-balance">{currentSection.name}</h3>
            </div>

            {/* Criterios con escala simple 1-5 */}
            <div className="space-y-6 md:space-y-8">
              {currentSection.subcriteria?.map((criterion) => (
                <div key={criterion.id} className="space-y-3 md:space-y-4">
                  <p className="text-sm md:text-base text-foreground leading-relaxed">{criterion.name}</p>

                  {/* Escala de calificación simple 1-5 */}
                  <div className="grid grid-col sm:flex-row items-stretch sm:items-center gap-3">

                    {/* Escala de radio buttons */}
                    <div className="space-y-2">
                      {/* Labels arriba */}
                      <div className="flex justify-between text-xs md:text-sm text-muted-foreground px-1">
                        {SCORE_SCALE.map((scale) => (
                          <span key={scale.value} className="flex-1 w-full text-center">
                            {scale.label}
                          </span>
                        ))}
                      </div>

                      {/* Botones redondos */}
                      <div className="flex items-center justify-between gap-2 md:gap-4 bg-muted/5 border-border rounded-lg p-3 md:p-4">
                        {SCORE_SCALE.map((scale) => (
                          <button
                            key={scale.value}
                            onClick={() => handleScoreChange(criterion.id, scale.value)}
                            className="flex flex-col items-center gap-2 cursor-pointer group flex-1"
                          >
                            <div
                              className={`h-6 w-6 md:h-7 md:w-7 rounded-full border-2 flex items-center justify-center transition-all ${scores[criterion.id] === scale.value
                                ? "border-primary bg-primary shadow-md scale-110"
                                : "border-muted-foreground/30 group-hover:border-muted-foreground/50"
                                }`}
                            >
                              {scores[criterion.id] === scale.value && (
                                <div className="h-3 w-3 md:h-3.5 md:w-3.5 rounded-full bg-primary-foreground" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Navegación entre secciones */}
            <div className="flex items-center justify-between pt-4 md:pt-6 border-t border-border gap-2">

              {/* Flecha Anterior (solo si NO es la primera página) */}
              {canGoPrevious ? (
                <Button
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="gap-1 md:gap-2"
                  size="sm"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Anterior</span>
                </Button>
              ) : (
                <div className="w-[90px]" /> // mantiene el layout estable
              )}

              <div className="flex gap-1.5 md:gap-2">
                {allSections.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx)}
                    className={`h-2 w-2 rounded-full transition-colors ${idx === currentPage ? "bg-primary" : "bg-muted-foreground/30"
                      }`}
                    aria-label={`Ir a sección ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Flecha Siguiente (solo si NO es la última página) */}
              {canGoNext ? (
                <Button
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="gap-1 md:gap-2"
                  size="sm"
                >
                  <span className="hidden sm:inline">Siguiente</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <div className="w-[90px]" /> // mantiene el layout estable
              )}

            </div>


            {/* Comments y botón de envío - solo en la última sección */}
            {currentPage === allSections.length - 1 && (
              <>
                <div className="space-y-2 pt-3 md:pt-4">
                  <Label htmlFor="comments" className="text-xs md:text-sm font-medium">
                    Comentarios y Retroalimentación
                  </Label>
                  <Textarea
                    id="comments"
                    placeholder="Escriba sus comentarios adicionales sobre la evaluación..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="min-h-[80px] md:min-h-[100px] resize-none text-sm"
                    disabled={isSubmitting}
                  />
                </div>

                <Button
                  className="w-full transition-transform hover:scale-[1.01] text-sm md:text-base"
                  color="primary"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="mr-2">Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Enviar evaluación
                    </>
                  )}
                </Button>
              </>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Confirmation Modal */}
      <Modal isOpen={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen} placement="center">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-warning" />
                  <span className="text-base md:text-lg">Confirmar Envío de Evaluación</span>
                </div>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Está a punto de enviar su evaluación para{" "}
                    <span className="font-semibold text-foreground">{project?.name}</span>.
                  </p>
                  <p className="text-sm text-warning">⚠️ Una vez enviada, esta evaluación no puede ser editada.</p>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="ghost" onClick={onClose}>
                  Cancelar
                </Button>
                <Button color="primary" onClick={handleConfirmSubmit} className="gap-2">
                  <Send className="h-4 w-4" />
                  Confirmar y Enviar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}
