"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardBody, CardHeader } from "@/components/ui/card"
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@/components/ui/dropdown"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal"
import {
  FileText,
  Users,
  Send,
  ArrowLeft,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  CheckCircle2,
} from "lucide-react"
import { useProject } from "@/features/projects/api/get-project"
import { AvatarGroup } from "@/features/projects/components/avatar-icon"
import { useCategoryCriteria } from "@/features/criteria/api/get-category-criterion"
import { useCreateEvaluation } from "@/features/evaluations/api/create-evaluation"
import { useNotifications } from "@/components/ui/notifications"
import { Spinner } from "@heroui/spinner"
import { normalizeCategoryId } from "@/lib/compat/category-legacy"
import { EventType } from '@/types/api'
import { documentLink, type DocumentRef } from "@/lib/document-link";
import { formatPoints, toScoreLevelOptions } from "@/features/grading-scales/utils/grading-scale"
import { useJuryAssignedProjects } from "@/features/projects-public/api/get-jury-project"

import { ScoreLevelPicker } from "./score-level-picker"
import { jurorEvaluationErrorMessage } from "../utils/evaluation-error"
import { formatWeight, partialGrade } from "../utils/criterion-weight"
import { maxGradeOf, useJurorEvent } from "../hooks/use-juror-event"
import { getEventDashboardHref } from "@/features/events/utils/event-roles"

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
  const [showMissing, setShowMissing] = useState(false)
  // Shown inside the evaluation card: a floating toast covered the page title
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { addNotification } = useNotifications()

  const { mutate } = useCreateEvaluation({
    mutationConfig: {
      onSuccess: () => {
        addNotification({
          type: "success",
          title: "Evaluación enviada exitosamente",
        })
        setIsSubmitting(false)
        router.push(getEventDashboardHref(project?.eventId, "JURY"))
      },
      onError: (error) => {
        setIsSubmitting(false)
        setSubmitError(jurorEvaluationErrorMessage(error?.message))
      },
    },
  })

  const { data: projectData, isLoading: isProjectLoading } = useProject({ projectId })

  const project = (projectData as any)?.data ?? projectData ?? null
  const projectCategoryId = normalizeCategoryId(project ?? {}) ?? ""
  const documents = project?.documents ?? []

  // Searches every page of /me/events, not only the first one
  const { event: currentEvent, gradingScale } = useJurorEvent(project?.eventId)
  const showProjectCode = currentEvent?.eventType === EventType.Exposition
  const scoreOptions = toScoreLevelOptions(gradingScale)
  const maxGrade = maxGradeOf(gradingScale)

  // The juror's own list says whether the project is assigned and already evaluated
  const assignedQuery = useJuryAssignedProjects({ eventId: Number(project?.eventId) })
  const assignedProject = assignedQuery.data?.find((item) => String(item.id) === String(projectId))
  const isNotAssigned = assignedQuery.isSuccess && !assignedProject
  const submittedEvaluation = assignedProject?.evaluated ? assignedProject.evaluation : undefined
  const isReadOnly = Boolean(submittedEvaluation)
  const submittedScores: Record<string, number> = Object.fromEntries(
    (submittedEvaluation?.scores ?? []).map((score) => [String(score.criterionId), score.score]),
  )
  // A submitted evaluation keeps the weight it was graded with, even if the rubric changed later
  const submittedWeights: Record<string, number> = Object.fromEntries(
    (submittedEvaluation?.scores ?? [])
      .filter((score) => score.weight !== undefined)
      .map((score) => [String(score.criterionId), score.weight as number]),
  )
  const shownScores = isReadOnly ? submittedScores : scores

  const {
    data: categoryCriteriaData,
    isLoading: isCategoryCriteriaLoading,
  } = useCategoryCriteria({
    categoryId: String(projectCategoryId),
    queryConfig: {
      enabled: !!projectCategoryId,
    },
  })

  if (isProjectLoading || isCategoryCriteriaLoading || assignedQuery.isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (isNotAssigned) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-center">
        <AlertCircle className="h-10 w-10 text-warning" />
        <p className="text-base md:text-lg font-semibold">
          Este proyecto no está asignado a tu evaluación
        </p>
        <Button variant="light" onClick={() => router.push(project?.eventId ? getEventDashboardHref(project.eventId, "JURY") : "/app")}>
          Volver
        </Button>
      </div>
    )
  }

  const backendSections =
    categoryCriteriaData?.map((cat, index) => ({
      id: `section-${index + 1}`,
      name: `${index + 1}. ${cat.category}`,
      // Weight of the component in the grade
      weight: cat.weight,
      isSection: true,
      subcriteria:
        cat.criterions?.map((c, cIdx) => {
          const id = c?.id ? String(c.id) : `criterion-${cIdx}`

          return {
            id,
            name: c?.name ?? "",
            // Effective weight of the criterion in the grade
            weight: (isReadOnly ? submittedWeights[id] : undefined) ?? c?.weight,
          }
        }) ?? [],
    })) ?? []

  const allSections = backendSections
  const currentSection = allSections[currentPage] ?? allSections[0]
  // The backend rejects an evaluation that leaves any criterion of the rubric without a score
  const missingCriteria = isReadOnly ? [] : allSections.flatMap((section, sectionIndex) =>
    section.subcriteria
      .filter((criterion) => scores[criterion.id] === undefined)
      .map((criterion) => ({ ...criterion, sectionIndex })),
  )

  // Grade of the levels chosen so far, shown next to "Enviar evaluación". Hidden when some
  // criterion has no weight or the scale has no points: the sum would not be the grade.
  const allCriteria = allSections.flatMap((section) => section.subcriteria)
  const pointsByLevel = new Map(scoreOptions.map((option) => [option.value, option.points]))
  const currentGrade =
    maxGrade !== undefined && allCriteria.every((criterion) => criterion.weight !== undefined)
      ? partialGrade(
          allCriteria
            .filter((criterion) => scores[criterion.id] !== undefined)
            .map((criterion) => ({
              weight: criterion.weight,
              points: pointsByLevel.get(scores[criterion.id]),
            })),
        )
      : undefined

  const handleScoreChange = (criterionId: string, value: number) => {
    setScores((prev) => ({
      ...prev,
      [criterionId]: value,
    }))
  }

  const handleSubmit = () => {
    if (isSubmitting) return

    if (missingCriteria.length > 0) {
      setShowMissing(true)
      setCurrentPage(missingCriteria[0].sectionIndex)
      return
    }

    setIsConfirmModalOpen(true)
  }

  const handleConfirmSubmit = () => {
    setIsConfirmModalOpen(false)
    setIsSubmitting(true)
    setSubmitError(null)

    const payload: any = {
      projectId: Number(projectId),
      scores: Object.entries(scores).map(([localId, value]) => ({
        criterionId: Number(localId),
        score: value,
      })),
    }

    if (comments.trim()) {
      payload.comments = comments.trim()
    }

    mutate({ data: payload })
  }

  const handleGoBack = () => {
    if (project?.eventId) {
      router.push(getEventDashboardHref(project.eventId, "JURY"))
    } else {
      router.push("/app")
    }
  }

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

  const canGoNext = currentPage < allSections.length - 1
  const canGoPrevious = currentPage > 0

  return (
    <div className="space-y-4">
      <div>
        <Button variant="light" className="gap-2" onClick={handleGoBack}>
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-card border-border bg-card h-fit">
          <CardBody className="p-4 md:p-6">
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-4">
                    {showProjectCode && (
                      (() => {
                        const projectLabel =
                          project?.projectCode || project?._projectCode || project?.data?.projectCode || project?.data?._projectCode || null

                        return projectLabel ? (
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-2xl font-semibold text-primary">
                            {projectLabel}
                          </div>
                        ) : null
                      })()
                    )}

                    <div className="min-w-0">
                      <h2 className="text-lg md:text-xl font-semibold text-balance">{project?.name}</h2>
                      <p className="mt-2 text-xs md:text-sm text-muted-foreground leading-relaxed">
                        {project?.description}
                      </p>
                    </div>
                  </div>
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
                      project?.pendingParticipants?.length > 0
                        ? project?.pendingParticipants
                            .filter((p: any) => p?.firstName && p?.lastName)
                            .map((p: any) => ({
                              name: `${String(p.firstName ?? "").trim()} ${String(p.lastName ?? "").trim()}`.trim(),
                            }))
                        : project?.participants
                            ?.filter((p: any) => p?.firstName && p?.lastName)
                            .map((p: any) => ({
                              name: `${String(p.firstName ?? "").trim()} ${String(p.lastName ?? "").trim()}`.trim(),
                            })) ?? []
                    }
                    size={35}
                  />
                </div>

                <div className="sm:hidden space-y-2">
                  {(project?.pendingParticipants?.length > 0 ? project?.pendingParticipants : project?.participants)
                    ?.filter((p: any) => p?.firstName && p?.lastName)
                    .map((participant: any, idx: number) => {
                      const firstName = String(participant.firstName ?? "").trim()
                      const lastName = String(participant.lastName ?? "").trim()

                      if (!firstName || !lastName) return null

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
                      )
                    })
                    .filter(Boolean)}
                </div>
              </div>

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
                        <span className="truncate font-medium">{getDocumentLabel(documents[0], 0)}</span>
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
          </CardBody>
        </Card>

        <Card className="glass-card border-border bg-card">
          {allSections.length === 0 ? (
            <CardBody className="flex min-h-[320px] flex-col items-center justify-center gap-3 p-4 md:p-6 text-center">
              <AlertCircle className="h-10 w-10 text-warning" />
              <div className="space-y-1">
                <h3 className="text-base md:text-lg font-semibold text-balance">
                  No hay criterios de evaluación disponibles
                </h3>
                <p className="text-sm text-muted-foreground">
                  Este proyecto no tiene secciones configuradas para evaluación todavía.
                </p>
              </div>
              <Button variant="light" onClick={handleGoBack}>
                Volver al evento
              </Button>
            </CardBody>
          ) : (
            <>
              <CardHeader className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-base md:text-lg font-semibold">
                      {isReadOnly ? "Evaluación enviada" : "Evaluación de Jurado"}
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">
                      Sección {currentPage + 1} de {allSections.length}
                    </p>
                  </div>
                  {submittedEvaluation && (
                    <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span className="font-medium">Tu nota:</span>
                      <span className="font-semibold">
                        {formatPoints(submittedEvaluation.grade)}
                        {maxGrade !== undefined ? ` / ${formatPoints(maxGrade)}` : ""}
                      </span>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardBody className="space-y-6 md:space-y-8 p-4 md:p-6">
                <div className="border-b border-border pb-3">
                  <h3 className="text-base md:text-lg font-semibold text-balance">
                    {currentSection?.name}
                    {currentSection?.weight !== undefined && (
                      <span className="ml-2 font-normal text-muted-foreground">
                        ({formatWeight(currentSection.weight)})
                      </span>
                    )}
                  </h3>
                </div>

                {/* On the last section it explains why "Enviar evaluación" is disabled */}
                {(showMissing || currentPage === allSections.length - 1) &&
                  missingCriteria.length > 0 && (
                  <div
                    className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning"
                    role="alert"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      Falta calificar {missingCriteria.length} criterio(s):{" "}
                      {missingCriteria
                        .map((criterion) => criterion.name)
                        .join(", ")}
                      .
                    </span>
                  </div>
                )}

                <div className="space-y-6 md:space-y-8">
                  {currentSection?.subcriteria?.map((criterion) => (
                    <div key={criterion.id} className="space-y-3 md:space-y-4">
                      <p className="text-sm md:text-base text-foreground leading-relaxed">
                        <span>{criterion.name}</span>
                        {criterion.weight !== undefined && (
                          <span className="ml-1.5 text-muted-foreground">
                            ({formatWeight(criterion.weight)})
                          </span>
                        )}
                      </p>

                      <ScoreLevelPicker
                        criterionName={criterion.name}
                        options={scoreOptions}
                        value={shownScores[criterion.id]}
                        onChange={(level) => handleScoreChange(criterion.id, level)}
                        disabled={isReadOnly}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 md:pt-6 border-t border-border gap-2">
                  {canGoPrevious ? (
                    <Button onClick={() => setCurrentPage((p) => p - 1)} className="gap-1 md:gap-2" size="sm">
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline">Anterior</span>
                    </Button>
                  ) : (
                    <div className="w-[90px]" />
                  )}

                  <div className="flex gap-1.5 md:gap-2">
                    {allSections.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentPage(idx)}
                        className={`h-2 w-2 rounded-full transition-colors ${
                          idx === currentPage ? "bg-primary" : "bg-muted-foreground/30"
                        }`}
                        aria-label={`Ir a sección ${idx + 1}`}
                      />
                    ))}
                  </div>

                  {canGoNext ? (
                    <Button onClick={() => setCurrentPage((p) => p + 1)} className="gap-1 md:gap-2" size="sm">
                      <span className="hidden sm:inline">Siguiente</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <div className="w-[90px]" />
                  )}
                </div>

                {currentPage === allSections.length - 1 && isReadOnly && (
                  <div className="space-y-2 pt-3 md:pt-4">
                    <p className="text-xs md:text-sm font-medium">Comentarios y Retroalimentación</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {submittedEvaluation?.comments?.trim() || "Sin comentarios"}
                    </p>
                  </div>
                )}

                {currentPage === allSections.length - 1 && !isReadOnly && (
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

                    {submitError && (
                      <div
                        className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
                        role="alert"
                      >
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{submitError}</span>
                      </div>
                    )}

                    {currentGrade !== undefined && maxGrade !== undefined && (
                      <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                        <span className="font-medium">
                          {missingCriteria.length > 0 ? "Nota parcial" : "Nota"}
                        </span>
                        <span className="font-semibold">
                          {`${formatPoints(currentGrade)} / ${formatPoints(maxGrade)}`}
                        </span>
                      </div>
                    )}

                    <Button
                      className="w-full transition-transform hover:scale-[1.01] text-sm md:text-base"
                      color="primary"
                      size="lg"
                      onClick={handleSubmit}
                      // Every criterion needs a level: the backend rejects an incomplete evaluation
                      isDisabled={isSubmitting || missingCriteria.length > 0}
                    >
                      {isSubmitting ? (
                        <span className="mr-2">Enviando...</span>
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
            </>
          )}
        </Card>
      </div>

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
                  <p className="text-sm text-warning">
                    ⚠️ Una vez enviada, esta evaluación no puede ser editada.
                  </p>
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
