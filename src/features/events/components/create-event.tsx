"use client";
import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import {
  today,
  getLocalTimeZone,
  parseDate,
  parseDateTime,
  parseZonedDateTime,
  parseAbsoluteToLocal,
  type DateValue,
} from "@internationalized/date";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";
import { useDisclosure } from '@/hooks/use-disclosure';
import { useNotifications } from "@/components/ui/notifications";
import { useUser } from "@/lib/auth";
import { canCreateEvent } from "@/lib/authorization";

import { createEventInputSchema, useCreateEvent } from "../api/create-events";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { DatePicker} from "@/components/ui/date-picker";
import { Select, SelectItem } from "@/components/ui/select";
import {
  compareDateTimes,
  getDatePart,
  ensureDateTimeValue,
} from "../utils/event-date-time";
import { toEventTypeCode, toEvaluationTypeCode } from "../utils/event-enums";

type Award = {
  title: string;
  description: string;
  value: string;
  position: number;
};

const isWholeNumberInput = (value: string) => value === "" || /^(0|[1-9]\d*)$/.test(value);
const isDecimalNumberInput = (value: string) => value === "" || /^(0|[1-9]\d*)(\.\d{0,2})?$/.test(value);
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const toDateTimePickerValue = (value?: string): DateValue | undefined => {
  const normalizedValue = ensureDateTimeValue(value);

  if (!normalizedValue) {
    return undefined;
  }

  if (DATE_ONLY_PATTERN.test(normalizedValue)) {
    return parseDateTime(`${normalizedValue}T00:00:00`);
  }

  try {
    return parseDateTime(normalizedValue);
  } catch {
    // Continue with other parsers for zoned/absolute values.
  }

  try {
    return parseZonedDateTime(normalizedValue);
  } catch {
    try {
      return parseAbsoluteToLocal(normalizedValue);
    } catch {
      return undefined;
    }
  }
};

type DateFieldErrors = {
  startDate?: string;
  endDate?: string;
  inscriptionDeadline?: string;
};

export const CreateEvent = () => {
  const { addNotification } = useNotifications();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<any>({
    isPubliclyJoinable: true,
    active: true,
    evaluationsOpened: false,
    eventType: 1,
    evaluationType: 1,
  });

  const [specificDetails, setSpecificDetails] = useState([{ title: "", description: "" }]);
  const [organizers, setOrganizers] = useState([""]);
  const [collaborators, setCollaborators] = useState([""]);
  const [dateFieldErrors, setDateFieldErrors] = useState<DateFieldErrors>({});
  const [awards, setAwards] = useState<Award[]>([
    { title: "", description: "", value: "", position: 1 },
  ]);

  const createEventMutation = useCreateEvent({
    mutationConfig: {
      onSuccess: () => {
        addNotification({
          type: "success",
          title: "Event Created",
        });
        resetForm();
        onClose();
      },
      onError: (e) => {
        addNotification({
          type: "error",
          title: "Validation Error",
          message: "Missing or invalid fields in your form submission.",
        });
      }
    },
  });

  const user = useUser();

  if (!canCreateEvent(user?.data)) {
    return null;
  }

  const resetForm = () => {
    setStep(1);
    setFormData({
      isPubliclyJoinable: true,
      active: true,
      evaluationsOpened: false,
      eventType: 1,
      evaluationType: 1,
    });
    setSpecificDetails([{ title: "", description: "" }]);
    setOrganizers([""]);
    setCollaborators([""]);
    setDateFieldErrors({});
    setAwards([{ title: "", description: "", value: "", position: 1 }]);
  };

  const validateDateFields = (targetStep: 1 | 2 | 3) => {
    const nextErrors: DateFieldErrors = {};

    if (targetStep === 1 || targetStep === 3) {
      if (!formData.startDate) {
        nextErrors.startDate = "La fecha y hora de inicio es requerida.";
      }

      if (!formData.endDate) {
        nextErrors.endDate = "La fecha y hora de finalización es requerida.";
      }

      if (formData.startDate && formData.endDate) {
        const endVsStart = compareDateTimes(formData.endDate, formData.startDate);
        if (endVsStart !== null && endVsStart < 0) {
          nextErrors.endDate = "Fecha y hora no pueden ser anteriores a la fecha y hora de inicio.";
        }
      }
    }

    if (targetStep === 2 || targetStep === 3) {
      if (!formData.inscriptionDeadline) {
        nextErrors.inscriptionDeadline = "La fecha límite de inscripción es requerida.";
      }

      if (formData.inscriptionDeadline && formData.startDate) {
        const deadlineVsStart = compareDateTimes(
          formData.inscriptionDeadline,
          formData.startDate
        );
        if (deadlineVsStart !== null && deadlineVsStart > 0) {
          nextErrors.inscriptionDeadline =
            "La fecha límite de inscripción no puede ser posterior a la fecha y hora de inicio.";
        }
      }

      if (formData.inscriptionDeadline && formData.endDate) {
        const deadlineVsEnd = compareDateTimes(
          formData.inscriptionDeadline,
          formData.endDate
        );
        if (deadlineVsEnd !== null && deadlineVsEnd > 0) {
          nextErrors.inscriptionDeadline =
            "La fecha límite de inscripción no puede ser posterior a la fecha y hora de finalización.";
        }
      }
    }

    setDateFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNextStep = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (step === 1 && !validateDateFields(1)) {
      return;
    }

    if (step === 2 && !validateDateFields(2)) {
      return;
    }

    // formData ya se mantiene actualizado por los onChange de cada campo.
    // Evitamos FormData porque DatePicker no se serializa como input nativo.
    setStep((prev) => prev + 1);
  };

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      if (!validateDateFields(3)) {
        addNotification({
          type: "error",
          title: "Fechas del evento inválidas",
          message: "Corrige los campos de fecha y hora resaltados.",
        });
        return;
      }

      const dataToSubmit = {
        ...formData,
        startDate: ensureDateTimeValue(formData.startDate),
        endDate: ensureDateTimeValue(formData.endDate),
        inscriptionDeadline: formData.inscriptionDeadline,
        evaluationsOpened: Boolean(formData.evaluationsOpened),
        isPubliclyJoinable: Boolean(formData.isPubliclyJoinable),
        active: Boolean(formData.active)??true,
        eventType: toEventTypeCode(formData.eventType),
        evaluationType: toEvaluationTypeCode(formData.evaluationType),
        locationDetails: formData.locationDetails || undefined,
        inscriptionCost:
          formData.inscriptionCost === "" || formData.inscriptionCost === undefined
            ? undefined
            : Number(formData.inscriptionCost),
        specificInscriptionDetails: specificDetails.filter(d => d.title && d.description),
        organizers: organizers.filter(o => o.trim() !== ""),
        collaborators: collaborators.filter(c => c.trim() !== ""),
        awards: awards
          .filter(a => a.title.trim() !== "")
          .map(a => ({
            title: a.title,
            description: a.description || undefined,
            value: a.value === "" ? undefined : Number(a.value),
            position: a.position,
          }))
      };

      if (!dataToSubmit.accessCode) delete dataToSubmit.accessCode;

      const values = await createEventInputSchema.parseAsync(dataToSubmit);
      await createEventMutation.mutateAsync({ data: values });
    } catch (err) {
      console.error(err);
      addNotification({ type: "error", title: "Form Validation Failed", message: "Check required fields." });
    }
  };

  return (
    <>
      <Button size="sm" onPress={() => { resetForm(); onOpen(); }}>
        <Plus size={16} />
        Crear Evento
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" scrollBehavior="inside">
        <ModalContent className="max-h-[80vh] flex flex-col">
          {(onClose) => (
            <Form
              className="w-full flex flex-col overflow-hidden flex-1 min-h-0"
              id="create-event-wizard"
              onSubmit={step === 3 ? handleCreateSubmit : handleNextStep}
            >
              <ModalHeader className="flex flex-col gap-1 text-2xl font-semibold shrink-0">
                Crear Evento {step > 1 ? `- Step ${step}` : ''}
              </ModalHeader>
              <ModalBody className="w-full flex-1 min-h-0 overflow-y-auto pl-6">

                {/* STEP 1: General Info */}
                {step === 1 && (
                  <div className="space-y-6 w-full fade-in">
                    <Input
                      label="Nombre del Evento"
                      name="name"
                      placeholder="Ej: Hackathon de Logística Empresarial (mínimo 2 caracteres)"
                      isRequired
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />

                    <div className="flex flex-col sm:flex-row gap-4">
                      <Input
                        label="Ubicación"
                        name="location"
                        placeholder="Ej: Universidad del Norte, Bloque, Salón."
                        isRequired
                        value={formData.location || ""}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="flex-1"
                      />
                      <Input
                        label="Detalles de la Ubicación (Opcional)"
                        name="locationDetails"
                        placeholder="Ej: Km 5 vía Puerto Colombia, Barranquilla "
                        value={formData.locationDetails || ""}
                        onChange={(e) => setFormData({ ...formData, locationDetails: e.target.value })}
                        className="flex-1"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <DatePicker
                        label="Fecha y Hora de Inicio"
                        name="startDate"
                        isRequired
                        granularity="minute"
                        value={toDateTimePickerValue(formData.startDate)}
                        onChange={(date) => {
                          setFormData((prev: any) => ({
                            ...prev,
                            startDate: date ? date.toString() : "",
                          }));
                          setDateFieldErrors((prev) => ({
                            ...prev,
                            startDate: undefined,
                            endDate: undefined,
                            inscriptionDeadline: undefined,
                          }));
                        }}
                        isInvalid={Boolean(dateFieldErrors.startDate)}
                        errorMessage={dateFieldErrors.startDate}
                        className="flex-1"
                        minValue={today(getLocalTimeZone())}
                      />
                      <DatePicker
                        label="Fecha y Hora de Finalización"
                        name="endDate"
                        isRequired
                        granularity="minute"
                        value={toDateTimePickerValue(formData.endDate)}
                        onChange={(date) => {
                          setFormData((prev: any) => ({
                            ...prev,
                            endDate: date ? date.toString() : "",
                          }));
                          setDateFieldErrors((prev) => ({
                            ...prev,
                            endDate: undefined,
                          }));
                        }}
                        isInvalid={Boolean(dateFieldErrors.endDate)}
                        errorMessage={dateFieldErrors.endDate}
                        className="flex-1"
                        minValue={today(getLocalTimeZone())}
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                      <Input
                        label="Código de Acceso"
                        name="accessCode"
                        placeholder="Ingrese el código de acceso al evento"
                        isRequired
                        value={formData.accessCode || ""}
                        onChange={(e) => setFormData({ ...formData, accessCode: e.target.value })}
                        className="flex-1"
                      />
                      <Select
                        label="Tipo de Evento"
                        name="eventType"
                        selectedKeys={[String(formData.eventType ?? 1)]}
                        onChange={(e) =>
                          setFormData({ ...formData, eventType: Number(e.target.value) })
                        }
                        isRequired
                        className="flex-1"
                      >
                        <SelectItem key="1">Exposición</SelectItem>
                        <SelectItem key="2">Competencia</SelectItem>
                      </Select>
                    </div>

                    <Select
                      label="Tipo de Evaluación"
                      name="evaluationType"
                      selectedKeys={new Set([String(formData.evaluationType ?? 1)])}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0];
                        if (selected !== undefined) {
                          setFormData({
                            ...formData,
                            evaluationType: toEvaluationTypeCode(selected),
                          });
                        }
                      }}
                      className="flex-1"
                    >
                      <SelectItem key="1">0 - 5</SelectItem>
                      <SelectItem key="2">0 - 100</SelectItem>
                      <SelectItem key="3">Proyectos Finales</SelectItem>
                    </Select>

                    <div className="pt-2 border-t border-default-200">
                      <p className="text-sm font-semibold mb-2">Detalles del Evento</p>
                      <Textarea
                        label="Descripción del Evento"
                        name="description"
                        placeholder="Describe de qué trata el evento. Ej: Un desafío tipo hackathon de 48 horas enfocado en optimización logística..."
                        isRequired
                        value={formData.description || ""}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        maxLength={1000}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-6 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Public For Join</span>
                        <Switch
                          size="sm"
                          name="isPubliclyJoinable"
                          isSelected={Boolean(formData.isPubliclyJoinable)}
                          onValueChange={(isSelected) =>
                            setFormData({ ...formData, isPubliclyJoinable: isSelected })
                            
                          }
                          color="success"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Active Event</span>
                      <Switch
                        size="sm"
                        name="active"
                        isSelected={Boolean(formData.active)}
                        onValueChange={(isSelected) =>
                          setFormData({ ...formData, active: isSelected })
                        }
                        color="success"
                      />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: Inscription Details */}
                {step === 2 && (
                  <div className="space-y-6 w-full fade-in">
                    <p className="border-b border-default-200 pb-2 font-semibold">Detalles de Inscripción</p>

                    <Textarea
                      label="Requisitos de Inscripción"
                      name="inscriptionRequirements"
                      isRequired
                      placeholder="Describa los requisitos para inscribirse en el evento. Ej: Equipos de 3 a 5 personas, con al menos un estudiante de ingeniería..."
                      value={formData.inscriptionRequirements || ""}
                      onChange={(e) => setFormData({ ...formData, inscriptionRequirements: e.target.value })}
                    />

                 
                    <div className="flex flex-col sm:flex-row gap-4">
                      <DatePicker
                        label="Fecha Limite de Inscripción"
                        name="inscriptionDeadline"
                        isRequired
                        value={
                          getDatePart(formData.inscriptionDeadline)
                            ? parseDate(getDatePart(formData.inscriptionDeadline))
                            : undefined
                        }
                        onChange={(date) => {
                          setFormData((prev: any) => ({
                            ...prev,
                            inscriptionDeadline: date ? date.toString() : "",
                          }));
                          setDateFieldErrors((prev) => ({
                            ...prev,
                            inscriptionDeadline: undefined,
                          }));
                        }}
                        className="flex-1"
                        minValue={today(getLocalTimeZone())}
                      />
                      <Input
                        label="Costo de Inscripción"
                        name="inscriptionCost"
                        type="text"
                        placeholder="Ej: 0 o 50000"
                        value={formData.inscriptionCost || ""}
                        min={0}
                        step={1}
                        inputMode="decimal"
                        pattern="[0-9]*"
                        onChange={(e) => {
                          if (isDecimalNumberInput(e.target.value)) {
                            setFormData({ ...formData, inscriptionCost: e.target.value });
                          }
                        }}
                        className="flex-1"
                      />
                      <Input
                        label="Mínimo Integrantes"
                        name="minimumTeamSize"
                        type="number"
                        placeholder="Ej: 3"
                        value={formData.minimumTeamSize || ""}
                        min={0}
                        step={1}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        onChange={(e) => {
                          if (isWholeNumberInput(e.target.value)) {
                            setFormData({ ...formData, minimumTeamSize: e.target.value });
                          }
                        }}
                        className="flex-1"
                      />
                    </div>

                    {/* Specific Inscription Details List */}
                    <div className="pt-4 border-t border-default-200">
                      <div className="flex justify-between items-center mb-4">
                        <p className="text-sm font-semibold">Detalles Específicos de Inscripción</p>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="faded"
                          onPress={() => setSpecificDetails([...specificDetails, { title: "", description: "" }])}
                        >
                          <Plus size={16} />
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {specificDetails.map((detail, index) => (
                          <div key={index} className="flex gap-2 items-start bg-default-50 p-3 rounded-md relative">
                            <Input
                              label="Título"
                              placeholder="Ej: Tamaño del equipo"
                              value={detail.title}
                              onChange={(e) => {
                                const newArr = [...specificDetails];
                                newArr[index].title = e.target.value;
                                setSpecificDetails(newArr);
                              }}
                              className="flex-1"
                            />
                            <Input
                              label="Descripción"
                              placeholder="Informacion Precisa. Ej: 3 a 5 estudiantes."
                              value={detail.description}
                              onChange={(e) => {
                                const newArr = [...specificDetails];
                                newArr[index].description = e.target.value;
                                setSpecificDetails(newArr);
                              }}
                              className="flex-2"
                            />
                            <Button
                              isIconOnly
                              size="sm"
                              className="mt-2"
                              color="danger"
                              variant="light"
                              onPress={() => setSpecificDetails(specificDetails.filter((_, i) => i !== index))}
                            >
                              <Minus size={16} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: Public Information */}
                {step === 3 && (
                  <div className="space-y-6 w-full fade-in">
                    <p className="border-b border-default-200 pb-2 font-semibold">Información Pública</p>

                    <Textarea
                      label="About Our Allies"
                      name="aboutOurAllies"
                      placeholder="Información sobre socios y aliados. Ej: Este evento cuenta con el apoyo de GRIP Shipping como aliado estratégico..."
                      value={formData.aboutOurAllies || ""}
                      onChange={(e) => setFormData({ ...formData, aboutOurAllies: e.target.value })}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Organizations */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-semibold">Organizaciones</p>
                          <Button isIconOnly size="sm" variant="faded" onPress={() => setOrganizers([...organizers, ""])}>
                            <Plus size={16} />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {organizers.map((org, index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                placeholder={`Organización ${index + 1}`}
                                value={org}
                                onChange={(e) => {
                                  const newArr = [...organizers];
                                  newArr[index] = e.target.value;
                                  setOrganizers(newArr);
                                }}
                              />
                              <Button isIconOnly variant="light" color="danger" onPress={() => setOrganizers(organizers.filter((_, i) => i !== index))}>
                                <Minus size={16} />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Collaborators */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-semibold">Colaboradores</p>
                          <Button isIconOnly size="sm" variant="faded" onPress={() => setCollaborators([...collaborators, ""])}>
                            <Plus size={16} />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {collaborators.map((col, index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                placeholder={`Colaborador ${index + 1}`}
                                value={col}
                                onChange={(e) => {
                                  const newArr = [...collaborators];
                                  newArr[index] = e.target.value;
                                  setCollaborators(newArr);
                                }}
                              />
                              <Button isIconOnly variant="light" color="danger" onPress={() => setCollaborators(collaborators.filter((_, i) => i !== index))}>
                                <Minus size={16} />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Awards */}
                    <div className="pt-4 border-t border-default-200">
                      <div className="flex justify-between items-center mb-4">
                        <p className="text-sm font-semibold">Premios</p>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="faded"
                          onPress={() =>
                            awards.length < 4 &&
                            setAwards([
                              ...awards,
                              {
                                title: "",
                                description: "",
                                value: "",
                                position: awards.length + 1,
                              },
                            ])
                          }
                        >
                          <Plus size={16} />
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {awards.map((award, index) => (
                          <div key={index} className="flex flex-col gap-3 bg-default-50 p-4 rounded-md relative border border-default-200">
                            <div className="absolute top-2 right-2">
                              <Button
                                isIconOnly
                                size="sm"
                                color="danger"
                                variant="light"
                                onPress={() =>
                                  setAwards((prev) =>
                                    prev
                                      .filter((_, i) => i !== index)
                                      .map((item, itemIndex) => ({
                                        ...item,
                                        position: itemIndex + 1,
                                      }))
                                  )
                                }
                              >
                                <Minus size={14} />
                              </Button>
                            </div>
                            <div className="flex gap-4 w-full pr-8">
                              {/* LEFT: Position */}
                              <div className="flex flex-col items-center justify-center bg-default-100 rounded-md px-3 py-2 min-w-[80px]">
                                <span className="text-sm text-default-500 font-semibold uppercase tracking-wider">
                                  Posición
                                </span>
                                <span className="text-4xl font-extrabold text-primary">
                                  {award.position}
                                </span>
                              </div>

                              {/* RIGHT: CONTENEDOR */}
                              <div className="flex flex-col flex-1 gap-2">

                                {/* TOP ROW */}
                                <div className="flex gap-3">
                                  <Input
                                    label="Título del Premio"
                                    placeholder="Ej: TOP 1"
                                    value={award.title}
                                    onChange={(e) => {
                                      setAwards((prev) => {
                                        const next = [...prev];
                                        next[index].title = e.target.value;
                                        return next;
                                      });
                                    }}
                                    className="flex-1"
                                  />

                                  <Input
                                    label="$ (Opcional)"
                                    type="text"
                                    placeholder="Ej:2000000"
                                    value={award.value}
                                    min={0}
                                    step={1}
                                    inputMode="decimal"
                                    pattern="[0-9]*"
                                    onChange={(e) => {
                                      if (isDecimalNumberInput(e.target.value)) {
                                        setAwards((prev) => {
                                          const next = [...prev];
                                          next[index].value = e.target.value;
                                          return next;
                                        });
                                      }
                                    }}
                                    className="w-[120px]"
                                  />
                                </div>

                                {/* BOTTOM ROW */}
                                <Textarea
                                  label="Descripción del Premio"
                                  placeholder="Ej: Premio monetario de $2.000.000 COP"
                                  value={award.description}
                                  onChange={(e) => {
                                    setAwards((prev) => {
                                      const next = [...prev];
                                      next[index].description = e.target.value;
                                      return next;
                                    });
                                  }}
                                  className="w-full"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}
              </ModalBody>
              <ModalFooter className="flex justify-between items-center pt-4 border-t border-default-200 shrink-0">
                <Button
                  type="button"
                  variant="flat"
                  onPress={() => step > 1 ? setStep(step - 1) : onClose()}
                >
                  {step > 1 ? "Atrás" : "Cancelar"}
                </Button>

                <Button
                  type="submit"
                  color="primary"
                  className="bg-teal-400 text-black font-semibold hover:bg-teal-500"
                  isLoading={createEventMutation.isPending}
                  disabled={createEventMutation.isPending}
                >
                  {step === 3 ? "Crear Evento" : "Siguiente"}
                </Button>
              </ModalFooter>
            </Form>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
