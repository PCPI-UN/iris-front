"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { ParticipantsStep } from "./wizard-steps/participants-step";
import { ProjectDetailsStep } from "./wizard-steps/project-details-step";
import { DocumentsStep } from "./wizard-steps/documents-step";
import { ReviewStep } from "./wizard-steps/review-step";
import { useCoursesDropdown } from "@/features/courses/api/get-courses-dropdown";
import { CheckCircle2, FileText, Users, Upload } from "lucide-react";
import { cn } from "@/utils/cn";
import { z } from "zod";
import {
  participantSchemaCompetition,
  participantSchemaExposition,
  projectSchema,
  documentsSchema,
} from "../schemas/wizard-schema";
import {
  createCompetitionInputSchema,
  createProjectInputSchema,
  useCreateProject,
} from "../api/create-project";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";
import { paths } from "@/config/paths";

export type Participant = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  studentCode: string;
  semester: string;
  career: string;
};

export type ProjectData = {
  name: string;
  description: string;
  categoryId: number;
};

export type DocumentsData = {
  poster: File | null;
  additionalDocuments: File[];
};

export type WizardData = {
  participants: Participant[];
  project: ProjectData;
  documents: DocumentsData;
};

type ProjectWizardProps = {
  eventId: number;
  eventType: "Competition" | "Exposition";
};

const CONFLICT_MESSAGE_KEYS = [
  "Conflicting active submissions found for emails",
  "already have an existing project in this event",
];

const normalizeBackendErrorMessage = (rawMessage: unknown): string => {
  const fallback = "Error al crear el proyecto. Por favor intente nuevamente.";

  const message = Array.isArray(rawMessage)
    ? rawMessage.join("\n")
    : typeof rawMessage === "string"
      ? rawMessage
      : fallback;

  const isConflictMessage = CONFLICT_MESSAGE_KEYS.some((key) =>
    message.toLowerCase().includes(key.toLowerCase()),
  );

  if (!isConflictMessage) {
    return message;
  }

  const emails = message.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];

  if (emails.length === 0) {
    return "Uno o más participantes ya tienen un proyecto registrado en este evento.";
  }

  return `Uno o más participantes ya tienen un proyecto registrado en este evento: ${emails.join(", ")}`;
};

export function ProjectWizard({ eventId, eventType}: ProjectWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const isCompetitionEvent = eventType === "Competition";
  const getSteps = () => {
    if (isCompetitionEvent) {
      return [
        { id: 1, name: "Participantes", icon: Users },
        { id: 2, name: "Revisión", icon: CheckCircle2 },
      ];
    }
    return [
      { id: 1, name: "Participantes", icon: Users },
      { id: 2, name: "Proyecto", icon: FileText },
      { id: 3, name: "Documentos", icon: Upload },
      { id: 4, name: "Revisión", icon: CheckCircle2 },
    ];
  };

  const steps = getSteps();
  const [stepErrors, setStepErrors] = useState<string[]>([]);
  const [isSubmitError, setIsSubmitError] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  

  const [wizardData, setWizardData] = useState<WizardData>({
    participants: [],
    project: {
      name: "",
      description: "",
      categoryId: 0,
    },
    documents: {
      poster: null,
      additionalDocuments: [],
    },
  });

  const competitionCoursesQuery = useCoursesDropdown({
    eventId,
    queryConfig: { enabled: isCompetitionEvent && !!eventId },
  });

  const autoAssignedCategoryId = competitionCoursesQuery.data?.data?.[0]?.id;

  useEffect(() => {
    if (!isCompetitionEvent || !autoAssignedCategoryId) {
      return;
    }

    setWizardData((prev) => {
      if (prev.project.categoryId === autoAssignedCategoryId) {
        return prev;
      }

      return {
        ...prev,
        project: {
          ...prev.project,
          categoryId: autoAssignedCategoryId,
        },
      };
    });
  }, [isCompetitionEvent, autoAssignedCategoryId]);

  const createProjectMutation = useCreateProject({
    mutationConfig: {
      onSuccess: () => {
        setIsSubmitError(false);
        setShowSuccessModal(true);
      },
      onError: (error: any) => {
        setIsSubmitError(true);
        const rawMessage =
          error?.response?.data?.message ||
          error?.message ||
          "Error al crear el proyecto. Por favor intente nuevamente.";
        const errorMessage = normalizeBackendErrorMessage(rawMessage);
        setStepErrors([errorMessage]);
      },
    },
  });

  const updateParticipants = (participants: Participant[]) => {
    setWizardData((prev) => ({ ...prev, participants }));
  };

  const updateProject = (project: ProjectData) => {
    setWizardData((prev) => ({ ...prev, project }));
  };

  const updateDocuments = (documents: DocumentsData) => {
    setWizardData((prev) => ({ ...prev, documents }));
  };

const validateStep = (step: number): boolean => {
  setIsSubmitError(false);
  setStepErrors([]);

  try {
    switch (step) {
      case 1: // Participantes
        const participantSchemaToUse = eventType === "Competition"
          ? z.array(participantSchemaCompetition)
          : z.array(participantSchemaExposition);
        
        participantSchemaToUse
          .min(1, "Debe agregar al menos un participante")
          .parse(wizardData.participants);
        return true;

      case 2:
        // Para Exposition, paso 2 es Proyecto
        if (eventType === "Exposition") {
          projectSchema.parse(wizardData.project);
        }
        // Para Competition, paso 2 es Review (no valida, solo muestra)
        return true;

      case 3: // Documentos (solo Exposition)
        documentsSchema.parse(wizardData.documents);
        return true;

      default:
        return true;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e) => e.message);
      setStepErrors(messages);
    }
    return false;
  }
};


  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setIsSubmitError(false);
      setStepErrors([]);
      setCurrentStep(currentStep - 1);
    }
  };

const handleSubmit = () => {
  setIsSubmitError(true);
  setStepErrors([]);

  try {
    // Para Competition, solo envía participantes
    if (isCompetitionEvent) {
      // Validar participantes
      z.array(participantSchemaCompetition)
        .min(1, "Debe agregar al menos un participante")
        .parse(wizardData.participants);

      if (!wizardData.project.categoryId) {
        setStepErrors(["No se pudo asignar automáticamente una categoría para este evento. Intente nuevamente más tarde."]);
        return;
      }

      // Validar schema de competencia
      const payloadData = {
        eventId: String(eventId),
        eventType: "Competition",
        categoryId: String(wizardData.project.categoryId),
        participants: JSON.stringify(
          wizardData.participants.map(p => ({
            firstName: p.firstName,
            lastName: p.lastName,
            email: p.email,
            studentCode: p.studentCode,
            semester: p.semester,
            career: p.career,
          }))
        ),
      };

      createCompetitionInputSchema.parse(payloadData);

      const formData = new FormData();
      formData.append("eventId", payloadData.eventId);
      formData.append("eventType", payloadData.eventType);
      formData.append("courseId", payloadData.categoryId);
      formData.append("participants", payloadData.participants);
      formData.append("name", `Equipo de ${wizardData.participants.map(p => p.firstName).join("-")}`);

      createProjectMutation.mutate({ data: formData });
      return;
    }

    // Para Exposition, envía todo como está
    // Validar participantes
    z.array(participantSchemaExposition)
      .min(1, "Debe agregar al menos un participante")
      .parse(wizardData.participants);

    // Validar proyecto
    projectSchema.parse(wizardData.project);

    // Validar documentos
    documentsSchema.parse(wizardData.documents);

    const payloadData = {
      name: wizardData.project.name,
      description: wizardData.project.description,
      eventId: String(eventId),
      eventType: "Exposition",
      categoryId: String(wizardData.project.categoryId),
      participants: JSON.stringify(
        wizardData.participants.map(p => ({
          firstName: p.firstName,
          lastName: p.lastName,
          email: p.email,
          studentCode: p.studentCode,
          semester: p.semester || "",
          career: p.career || "",
        }))
      ),
      documents: JSON.stringify([
        ...(wizardData.documents.poster ? [{ type: "POSTER", url: "" }] : []),
        ...wizardData.documents.additionalDocuments.map(() => ({ type: "SUPPORTING_DOCUMENT", url: "" })),
      ]),
      files: [
        ...(wizardData.documents.poster ? [wizardData.documents.poster] : []),
        ...wizardData.documents.additionalDocuments,
      ],
    };

    createProjectInputSchema.parse(payloadData);

    const formData = new FormData();
    formData.append("name", payloadData.name);
    if (payloadData.description) formData.append("description", payloadData.description);
    formData.append("eventId", payloadData.eventId);
    formData.append("eventType", payloadData.eventType);
    formData.append("courseId", payloadData.categoryId);
    formData.append("participants", payloadData.participants);
    formData.append("documents", payloadData.documents);

    payloadData.files.forEach(file => formData.append("files", file));

    createProjectMutation.mutate({ data: formData });

  } catch (e) {
    if (e instanceof z.ZodError) {
      setStepErrors(e.issues.map(i => i.message));
    }
  }
};



  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Progress Steps */}
      <nav aria-label="Progress" className="px-2 sm:px-4">
        <ol className="flex items-center justify-center max-w-3xl mx-auto">
          {steps.map((step, stepIdx) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <li
                key={step.id}
                className={cn("relative flex flex-col items-center flex-1")}
              >
                {stepIdx !== steps.length - 1 && (
                  <div
                    className={cn(
                      "absolute top-4 sm:top-5 h-0.5 left-1/2 w-full",
                      isCompleted ? "bg-primary" : "bg-border/30"
                    )}
                    aria-hidden="true"
                  />
                )}
                <button
                  className={cn(
                    "relative z-10 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border-2 transition-all duration-300 flex-shrink-0",
                    isCompleted &&
                      "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/50",
                    isCurrent &&
                      "border-primary bg-background text-primary ring-4 ring-primary/20",
                    !isCompleted &&
                      !isCurrent &&
                      "border-border/50 bg-background/50 text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
                <span
                  className={cn(
                    "mt-1.5 sm:mt-2 text-xs sm:text-sm font-medium text-center max-w-[80px] sm:max-w-none",
                    isCurrent ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.name}
                </span>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Step Content with Glass Effect */}
      <div className="glass-card p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border border-border/30">
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              {steps[currentStep - 1].name}
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm">
              {currentStep === 1 && "Agregue los participantes"}
              {currentStep === 2 && eventType === "Exposition" && "Ingrese los detalles del proyecto"}
              {currentStep === 3 && eventType === "Exposition" && "Suba los documentos requeridos"}
              {currentStep === 2 && eventType === "Competition" && "Revise la información antes de enviar"}
              {currentStep === 4 && eventType === "Exposition" && "Revise la información antes de enviar"}
            </p>
          </div>
        </div>

        <div>
          {currentStep === 1 && (
            <ParticipantsStep
              participants={wizardData.participants}
              onUpdate={updateParticipants}
              eventType={eventType}  // ← AÑADE ESTO
            />
          )}
          {currentStep === 2 && eventType === "Exposition" && (
            <ProjectDetailsStep
              eventId={eventId}
              project={wizardData.project}
              onUpdate={updateProject}
            />
          )}
          {currentStep === 3 && eventType === "Exposition" && (
            <DocumentsStep
              documents={wizardData.documents}
              onUpdate={updateDocuments}
            />
          )}
          {currentStep === 4 && eventType === "Exposition" && (
            <ReviewStep data={wizardData} eventType={eventType} />
          )}
          {currentStep === 2 && eventType === "Competition" && (
            <ReviewStep data={wizardData} eventType={eventType} />
          )}

          {/* Mostrar errores de validación */}
          {stepErrors.length > 0 && (
            <div className="mt-4 p-3 sm:p-4 glass-card border-2 border-red-500/50 rounded-lg">
              <p className="text-red-400 font-semibold mb-2 text-sm sm:text-base">
                {isSubmitError
                  ? "¡Ups! No pudimos completar tu registro"
                  : "¡Ups! Algo salió mal"}
              </p>
              <ul className="list-disc list-inside space-y-1">
                {stepErrors.map((error, idx) => (
                  <li key={idx} className="text-red-300 text-xs sm:text-sm">
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 px-2 sm:px-0">
        <Button
          variant="bordered"
          onPress={handleBack}
          isDisabled={currentStep === 1}
          className="glass-effect border-border/50 hover:border-primary/50 transition-all w-full sm:w-auto order-2 sm:order-1"
        >
          Anterior
        </Button>
        {currentStep < steps.length ? (
          <Button
            color="primary"
            onPress={handleNext}
            className="shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all w-full sm:w-auto order-1 sm:order-2"
          >
            Siguiente
          </Button>
        ) : (
          <Button
            color="success"
            onPress={handleSubmit}
            isLoading={createProjectMutation.isPending}
            isDisabled={createProjectMutation.isPending}
            className="shadow-lg shadow-success/30 hover:shadow-xl hover:shadow-success/40 transition-all w-full sm:w-auto order-1 sm:order-2"
          >
            {createProjectMutation.isPending 
              ? eventType === "Competition" 
                ? "Inscribiendo..." 
                : "Creando..."
              : eventType === "Competition"
              ? "Inscribir Equipo"
              : "Enviar Proyecto"}
          </Button>
        )}
      </div>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onOpenChange={setShowSuccessModal}
        isDismissable={false}
        hideCloseButton
        size="lg"
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center justify-center w-full mb-4">
                  <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-success" />
                  </div>
                </div>
              </ModalHeader>
              <ModalBody className="text-center pb-6">
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {eventType === "Competition"
                    ? "¡Equipo Inscrito Exitosamente!"
                    : "¡Proyecto Enviado Exitosamente!"}
                </h3>
                <p className="text-muted-foreground">
                  {eventType === "Competition"
                    ? "Tu participación ha sido recibida correctamente."
                    : `Tu proyecto "${wizardData.project.name}" ha sido registrado correctamente.`}
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  Te notificaremos sobre el estado de tu{" "}
                  {eventType === "Competition" ? "participación" : "proyecto"}{" "}
                  a través de tu correo electrónico.
                </p>
              </ModalBody>
              <ModalFooter className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  color="primary"
                  onPress={() => {
                    setShowSuccessModal(false);
                    router.push(paths.home.getHref());
                  }}
                  className="w-full sm:w-auto shadow-lg shadow-primary/30"
                >
                  Ir al Inicio
                </Button>
                <Button
                  color="primary"
                  variant="bordered"
                  onPress={() => {
                    setShowSuccessModal(false);
                    router.push(paths.app.dashboard.getHref());
                  }}
                  className="w-full sm:w-auto shadow-lg shadow-primary/30"
                >
                  Ir al Dashboard
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
