"use client";
import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { today, getLocalTimeZone, parseDate } from "@internationalized/date";
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
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectItem } from "@/components/ui/select";

type Award = {
  title: string;
  description: string;
  value: string;
  position: number;
};

const isWholeNumberInput = (value: string) => value === "" || /^(0|[1-9]\d*)$/.test(value);
const isDecimalNumberInput = (value: string) => value === "" || /^(0|[1-9]\d*)(\.\d{0,2})?$/.test(value);

const toEndOfDayISO = (value?: string) => {
  if (!value) {
    return value;
  }
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) {
    return value;
  }
  // Preserve selected calendar day and avoid UTC timezone shifts.
  return `${value}T23:59:59.999`;
};
export const CreateEvent = () => {
  const { addNotification } = useNotifications();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<any>({
    isPubliclyJoinable: true,
    active: true,
    evaluationsOpened: false,
    eventType: "Exposition",
    evaluationType: "ZERO_TO_FIVE",
  });

  const [specificDetails, setSpecificDetails] = useState([{ title: "", description: "" }]);
  const [organizers, setOrganizers] = useState([""]);
  const [collaborators, setCollaborators] = useState([""]);
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
      eventType: "Exposition",
      evaluationType: "ZERO_TO_FIVE",
    });
    setSpecificDetails([{ title: "", description: "" }]);
    setOrganizers([""]);
    setCollaborators([""]);
    setAwards([{ title: "", description: "", value: "", position: 1 }]);
  };

  const handleNextStep = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const currentFormData = new FormData(form);
    const rawData = Object.fromEntries(currentFormData);
    const updatedForm = { ...formData, ...rawData, isPubliclyJoinable: formData.isPubliclyJoinable, active: formData.active };

    setFormData(updatedForm);
    setStep((prev) => prev + 1);
  };

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const dataToSubmit = {
        ...formData,
        inscriptionDeadline: toEndOfDayISO(formData.inscriptionDeadline),
        evaluationsOpened: Boolean(formData.evaluationsOpened),
        isPubliclyJoinable: Boolean(formData.isPubliclyJoinable),
        active: Boolean(formData.active)??true,
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
      delete dataToSubmit.locationDetail;
      delete dataToSubmit.cost;
      delete dataToSubmit.organizations;

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
        Create Event
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
                Create Event {step > 1 ? `- Step ${step}` : ''}
              </ModalHeader>
              <ModalBody className="w-full flex-1 min-h-0 overflow-y-auto pr-2">

                {/* STEP 1: General Info */}
                {step === 1 && (
                  <div className="space-y-6 w-full fade-in">
                    <Input
                      label="Title"
                      name="name"
                      placeholder="Nombre del evento. Ej: Hackathon de Logística Empresarial (mínimo 2 caracteres)"
                      isRequired
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />

                    <div className="flex flex-col sm:flex-row gap-4">
                      <Input
                        label="Location"
                        name="location"
                        placeholder="Ej: Universidad del Norte, Bloque, Salón."
                        isRequired
                        value={formData.location || ""}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="flex-1"
                      />
                      <Input
                        label="Location detail (Optional)"
                        name="locationDetails"
                        placeholder="Ej: Km 5 vía Puerto Colombia, Barranquilla "
                        value={formData.locationDetails || ""}
                        onChange={(e) => setFormData({ ...formData, locationDetails: e.target.value })}
                        className="flex-1"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <DatePicker label="Start Date" name="startDate" isRequired defaultValue={formData.startDate ? parseDate(formData.startDate) : undefined} className="flex-1" minValue={today(getLocalTimeZone())} />
                      <DatePicker label="End Date" name="endDate" isRequired defaultValue={formData.endDate ? parseDate(formData.endDate) : undefined} className="flex-1" minValue={today(getLocalTimeZone())} />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                      <Input
                        label="Access Code"
                        name="accessCode"
                        placeholder="Enter Event Access Code"
                        isRequired
                        value={formData.accessCode || ""}
                        onChange={(e) => setFormData({ ...formData, accessCode: e.target.value })}
                        className="flex-1"
                      />
                      <Select
                        label="Event Type"
                        name="eventType"
                        defaultSelectedKeys={[formData.eventType]}
                        onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                        isRequired
                        className="flex-1"
                      >
                        <SelectItem key="Exposition">Exposition</SelectItem>
                        <SelectItem key="Competition">Competition</SelectItem>
                      </Select>
                    </div>

                    <Select
                      label="Evaluation Type"
                      name="evaluationType"
                      defaultSelectedKeys={[formData.evaluationType]}
                      onChange={(e) => setFormData({ ...formData, evaluationType: e.target.value })}
                      className="flex-1"
                    >
                      <SelectItem key="ZERO_TO_FIVE">0 - 5</SelectItem>
                      <SelectItem key="ZERO_TO_HUNDRED">0 - 100</SelectItem>
                    </Select>

                    <div className="pt-2 border-t border-default-200">
                      <p className="text-sm font-semibold mb-2">Event Details</p>
                      <Textarea
                        label="Description"
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
                    <p className="border-b border-default-200 pb-2 font-semibold">Inscription Details</p>

                    <Textarea
                      label="Inscription Requirements"
                      name="inscriptionRequirements"
                      isRequired
                      placeholder="Describa los requisitos para inscribirse en el evento. Ej: Equipos de 3 a 5 personas, con al menos un estudiante de ingeniería..."
                      value={formData.inscriptionRequirements || ""}
                      onChange={(e) => setFormData({ ...formData, inscriptionRequirements: e.target.value })}
                    />

                    <div className="flex flex-col sm:flex-row gap-4">
                      <DatePicker
                        label="Inscription Deadline"
                        name="inscriptionDeadline"
                        isRequired
                        defaultValue={formData.inscriptionDeadline ? parseDate(formData.inscriptionDeadline) : undefined}
                        className="flex-1"
                        minValue={today(getLocalTimeZone())}
                      />
                      <Input
                        label="Inscription Cost"
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
                        label="Minimum Team Size"
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
                        <p className="text-sm font-semibold">Specific Inscription Details</p>
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
                              label="Title"
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
                              label="Description"
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
                    <p className="border-b border-default-200 pb-2 font-semibold">Public Information</p>

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
                          <p className="text-sm font-semibold">Organizations</p>
                          <Button isIconOnly size="sm" variant="faded" onPress={() => setOrganizers([...organizers, ""])}>
                            <Plus size={16} />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {organizers.map((org, index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                placeholder={`Organization ${index + 1}`}
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
                          <p className="text-sm font-semibold">Collaborators</p>
                          <Button isIconOnly size="sm" variant="faded" onPress={() => setCollaborators([...collaborators, ""])}>
                            <Plus size={16} />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {collaborators.map((col, index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                placeholder={`Collaborator ${index + 1}`}
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
                        <p className="text-sm font-semibold">Awards</p>
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
                                  Position
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
                                    label="Award Title"
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
                                    label="$"
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
                                  label="Award Description (Optional)"
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
                  {step > 1 ? "Back" : "Cancel"}
                </Button>

                <Button
                  type="submit"
                  color="primary"
                  className="bg-teal-400 text-black font-semibold hover:bg-teal-500"
                  isLoading={createEventMutation.isPending}
                  disabled={createEventMutation.isPending}
                >
                  {step === 3 ? "Create Event" : "Next"}
                </Button>
              </ModalFooter>
            </Form>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
