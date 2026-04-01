"use client";

import { parseDate } from "@internationalized/date";
import { Minus, Plus, SquarePen } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@/components/ui/modal";
import { useNotifications } from "@/components/ui/notifications";
import { Select, SelectItem } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useDisclosure } from "@/hooks/use-disclosure";
import { useUser } from "@/lib/auth";
import { canUpdateEvent } from "@/lib/authorization";
import { useCoursesDropdown } from "@/features/courses/api/get-courses-dropdown";

import { useEvent } from "../api/get-event";
import { updateEventInputSchema, useUpdateEvent } from "../api/update-event";

type UpdateEventProps = {
  eventId: number;
};

type Award = {
  title: string;
  description: string;
  value: string;
  position: number;
  categoryId: string;
  categoryName?: string;
};
const isWholeNumberInput = (value: string) => value === "" || /^(0|[1-9]\d*)$/.test(value);
const isDecimalNumberInput = (value: string) => value === "" || /^(0|[1-9]\d*)(\.\d{0,2})?$/.test(value);
type InscriptionDetail = {
  title: string;
  description: string;
};

type UpdateEventFormState = {
  name: string;
  description: string;
  accessCode: string;
  startDate: string;
  endDate: string;
  inscriptionDeadline: string;
  location: string;
  locationDetails: string;
  evaluationsOpened: boolean;
  isPubliclyJoinable: boolean;
  active: boolean;
  inscriptionRequirements: string;
  inscriptionCost: string;
  minimumTeamSize: string;
  aboutOurAllies: string;
  evaluationType: "ZERO_TO_FIVE" | "ZERO_TO_HUNDRED";
};

const INITIAL_FORM_STATE: UpdateEventFormState = {
  name: "",
  description: "",
  accessCode: "",
  startDate: "",
  endDate: "",
  inscriptionDeadline: "",
  location: "",
  locationDetails: "",
  evaluationsOpened: false,
  isPubliclyJoinable: true,
  active: true,
  inscriptionCost: "",
  inscriptionRequirements: "",
  minimumTeamSize: "",
  aboutOurAllies: "",
  evaluationType: "ZERO_TO_FIVE",
};

export const UpdateEvent = ({ eventId }: UpdateEventProps) => {
  const { addNotification } = useNotifications();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<UpdateEventFormState>(INITIAL_FORM_STATE);
  const [specificDetails, setSpecificDetails] = useState<InscriptionDetail[]>([
    { title: "", description: "" },
  ]);
  const [organizers, setOrganizers] = useState<string[]>([""]);
  const [collaborators, setCollaborators] = useState<string[]>([""]);
  const [awards, setAwards] = useState<Award[]>([
    { title: "", description: "", value: "", position: 1, categoryId: "" },
  ]);

  const eventQuery = useEvent({ eventId });
  const coursesDropdownQuery = useCoursesDropdown({ eventId });
  const updateEventMutation = useUpdateEvent({
    mutationConfig: {
      onSuccess: () => {
        addNotification({
          type: "success",
          title: "Event Updated",
        });
        setStep(1);
        onClose();
      },
    },
  });

  const user = useUser();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const event = eventQuery.data?.data;
    if (!event) {
      return;
    }
    const rawEvaluationType = String(event.evaluationType ?? "");

    setFormData({
      name: event.name ?? "",
      description: event.description ?? "",
      accessCode: event.accessCode ?? "",
      startDate: event.startDate ? event.startDate.split("T")[0] : "",
      endDate: event.endDate ? event.endDate.split("T")[0] : "",
      inscriptionDeadline: event.inscriptionDeadline
        ? event.inscriptionDeadline.split("T")[0]
        : "",
      location: event.location ?? "",
      locationDetails: event.locationDetails ?? "",
      evaluationsOpened: Boolean(event.evaluationsOpened),
      isPubliclyJoinable: Boolean(event.isPubliclyJoinable),
      active: Boolean(event.active),
      inscriptionCost: event.inscriptionCost !== undefined && event.inscriptionCost !== null ? String(event.inscriptionCost) : "",
      inscriptionRequirements: event.inscriptionRequirements ?? "",
      minimumTeamSize:
        event.minimumTeamSize !== undefined && event.minimumTeamSize !== null
          ? String(event.minimumTeamSize)
          : "",
      aboutOurAllies: event.aboutOurAllies ?? "",
      evaluationType:
        rawEvaluationType === "ZERO_TO_FIVE" || rawEvaluationType === "0-5"
          ? "ZERO_TO_FIVE"
          : rawEvaluationType === "ZERO_TO_HUNDRED" || rawEvaluationType === "0-100"
            ? "ZERO_TO_HUNDRED"
            : "ZERO_TO_FIVE",
    });

    setSpecificDetails(
      event.specificInscriptionDetails && event.specificInscriptionDetails.length > 0
        ? event.specificInscriptionDetails.map((detail) => ({
          title: detail.title,
          description: detail.description,
        }))
        : [{ title: "", description: "" }]
    );

    setOrganizers(
      event.organizers && event.organizers.length > 0 ? event.organizers : [""]
    );

    setCollaborators(
      event.collaborators && event.collaborators.length > 0
        ? event.collaborators
        : [""]
    );

    setAwards(
      event.awards && event.awards.length > 0
        ? event.awards.map((award) => ({
          title: award.title ?? "",
          description: award.description ?? "",
          value:
            (award as { value?: number }).value !== undefined &&
              (award as { value?: number }).value !== null
              ? String((award as { value?: number }).value)
              : "",
          position: Number(award.position) || 1,
          categoryId:
            (award as { categoryId?: number }).categoryId !== undefined
              ? String((award as { categoryId?: number }).categoryId)
              : "",
          categoryName: (award as { category?: string }).category,
        }))
        : [{ title: "", description: "", value: "", position: 1, categoryId: "" }]
    );
  }, [isOpen, eventQuery.data]);

  if (!canUpdateEvent(user?.data)) {
    return null;
  }

  const event = eventQuery.data?.data;
  const eventCourses = coursesDropdownQuery.data?.data ?? [];

  const handleNextStep = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const submitUpdate = async () => {
    try {
      const dataToSubmit = {
        id: Number(eventId),
        name: formData.name,
        description: formData.description,
        accessCode: formData.accessCode || undefined,
        isPubliclyJoinable: formData.isPubliclyJoinable ?? event?.isPubliclyJoinable,
        startDate: formData.startDate,
        endDate: formData.endDate,
        inscriptionDeadline: formData.inscriptionDeadline,
        evaluationsOpened: formData.evaluationsOpened,
        active: formData.active,
        location: formData.location || undefined,
        locationDetails: formData.locationDetails || undefined,
        inscriptionCost: formData.inscriptionCost === "" ? undefined : Number(formData.inscriptionCost),
        inscriptionRequirements: formData.inscriptionRequirements || undefined,
        minimumTeamSize:
          formData.minimumTeamSize === "" ? undefined : Number(formData.minimumTeamSize),
        aboutOurAllies: formData.aboutOurAllies || undefined,
        evaluationType: formData.evaluationType,
        organizers: organizers.filter((value) => value.trim() !== ""),
        collaborators: collaborators.filter((value) => value.trim() !== ""),
        specificInscriptionDetails: specificDetails.filter(
          (detail) => detail.title.trim() !== "" && detail.description.trim() !== ""
        ),
        awards: awards
          .filter((award) => award.title.trim() !== "")
          .map((award) => ({
            title: award.title,
            description: award.description || undefined,
            value: award.value === "" ? undefined : Number(award.value),
            position: award.position,
            categoryId: award.categoryId ? Number(award.categoryId) : undefined,
          })),
      };

      const values = await updateEventInputSchema.parseAsync(dataToSubmit);
      await updateEventMutation.mutateAsync({ data: values });
    } catch (error) {
      console.error(error);
      addNotification({
        type: "error",
        title: "Form Validation Failed",
        message: "Check required fields.",
      });
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await submitUpdate();
  };

  return (
    <>
      <Button
        variant="shadow"
        className="w-full"
        size="sm"
        onPress={async () => {
          setStep(1);
          try {
            await eventQuery.refetch();
          } finally {
            onOpen();
          }
        }}
      >
        <SquarePen size={16} />
        Update Event
      </Button>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl" scrollBehavior="inside">
        <ModalContent className="max-h-[80vh] flex flex-col">
          {(onCloseModal) => {
            if (eventQuery.isLoading) {
              return (
                <>
                  <ModalHeader>Update Event</ModalHeader>
                  <ModalBody className="flex items-center justify-center py-12">
                    <Spinner size="lg" />
                  </ModalBody>
                </>
              );
            }

            if (!event) {
              return (
                <>
                  <ModalHeader>Update Event</ModalHeader>
                  <ModalBody>
                    <p>Event not found</p>
                  </ModalBody>
                  <ModalFooter>
                    <Button onPress={onCloseModal}>Close</Button>
                  </ModalFooter>
                </>
              );
            }

            return (
              <Form
                key={`update-event-${eventId}-${event.updatedAt}`}
                id="update-event"
                className="w-full flex flex-col overflow-hidden flex-1 min-h-0"
                onSubmit={step === 3 ? handleUpdateSubmit : handleNextStep}
              >
                <ModalHeader className="flex flex-col gap-1 text-2xl font-semibold shrink-0">
                  Update Event {step > 1 ? `- Step ${step}` : ""}
                </ModalHeader>

                <ModalBody className="w-full flex-1 min-h-0 overflow-y-auto pr-2">
                  {step === 1 && (
                    <div className="space-y-6 w-full fade-in">
                      <Input
                        label="Name"
                        name="name"
                        isRequired
                        value={formData.name}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, name: e.target.value }))
                        }
                      />

                      <div className="flex flex-col sm:flex-row gap-4">
                        <Input
                          label="Location"
                          name="location"
                          isRequired
                          value={formData.location}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, location: e.target.value }))
                          }
                          className="flex-1"
                        />
                        <Input
                          label="Location detail (Optional)"
                          name="locationDetails"
                          value={formData.locationDetails}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, locationDetails: e.target.value }))
                          }
                          className="flex-1"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4">
                        <DatePicker
                          label="Start Date"
                          name="startDate"
                          isRequired
                          value={formData.startDate ? parseDate(formData.startDate) : undefined}
                          onChange={(date) =>
                            setFormData((prev) => ({
                              ...prev,
                              startDate: date ? date.toString() : "",
                            }))
                          }
                          className="flex-1"
                        />
                        <DatePicker
                          label="End Date"
                          name="endDate"
                          isRequired
                          value={formData.endDate ? parseDate(formData.endDate) : undefined}
                          onChange={(date) =>
                            setFormData((prev) => ({
                              ...prev,
                              endDate: date ? date.toString() : "",
                            }))
                          }
                          className="flex-1"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <Input
                          label="Access Code"
                          name="accessCode"
                          value={formData.accessCode}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, accessCode: e.target.value }))
                          }
                          className="flex-1"
                        />
                        <Select
                          label="Evaluation Type"
                          selectedKeys={[formData.evaluationType]}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              evaluationType: e.target.value as "ZERO_TO_FIVE" | "ZERO_TO_HUNDRED",
                            }))
                          }
                          className="flex-1"
                        >
                          <SelectItem key="ZERO_TO_FIVE">0 - 5</SelectItem>
                          <SelectItem key="ZERO_TO_HUNDRED">0 - 100</SelectItem>
                        </Select>
                      </div>

                      <div className="pt-2 border-t border-default-200">
                        <p className="text-sm font-semibold mb-2">Event Details</p>
                        <Textarea
                          label="Description"
                          name="description"
                          isRequired
                          value={formData.description}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, description: e.target.value }))
                          }
                          maxLength={1000}
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-6 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Evaluations Open</span>
                          <Switch
                            isSelected={formData.evaluationsOpened}
                            onValueChange={(isSelected) =>
                              setFormData((prev) => ({ ...prev, evaluationsOpened: isSelected }))
                            }
                            color="success"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Active Event</span>
                          <Switch
                            isSelected={formData.active}
                            onValueChange={(isSelected) =>
                              setFormData((prev) => ({ ...prev, active: isSelected, }))
                            }
                            color="success"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Public for Join</span>
                          <Switch
                            isSelected={formData.isPubliclyJoinable}
                            onValueChange={(isSelected) =>
                              setFormData((prev) => ({
                                ...prev,isPubliclyJoinable: isSelected,
                              }))
                            }
                            color="success"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-6 w-full fade-in">
                      <p className="border-b border-default-200 pb-2 font-semibold">
                        Inscription Details
                      </p>

                      <Textarea
                        label="Inscription Requirements"
                        name="inscriptionRequirements"
                        isRequired
                        value={formData.inscriptionRequirements}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            inscriptionRequirements: e.target.value,
                          }))
                        }
                      />

                      <div className="flex flex-col sm:flex-row gap-4">
                        <DatePicker
                          label="Inscription Deadline"
                          name="inscriptionDeadline"
                          isRequired
                          value={
                            formData.inscriptionDeadline
                              ? parseDate(formData.inscriptionDeadline)
                              : undefined
                          }
                          onChange={(date) =>
                            setFormData((prev) => ({
                              ...prev,
                              inscriptionDeadline: date ? date.toString() : "",
                            }))
                          }
                          className="flex-1"
                        />
                        <Input
                          label="Inscription Cost"
                          name="inscriptionCost"
                          type="text"
                          value={formData.inscriptionCost}
                          min={0}
                          step={1}
                          inputMode="decimal"
                          pattern="[0-9]*"
                          onChange={(e) =>
                            isDecimalNumberInput(e.target.value) &&
                            setFormData((prev) => ({ ...prev, inscriptionCost: e.target.value }))
                          }
                          className="flex-1"
                        />
                        <Input
                          label="Minimum Team Size"
                          name="minimumTeamSize"
                          type="number"
                          value={formData.minimumTeamSize}
                          min={0}
                          step={1}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          onChange={(e) =>
                            isWholeNumberInput(e.target.value) &&
                            setFormData((prev) => ({ ...prev, minimumTeamSize: e.target.value }))
                          }
                          className="flex-1"
                        />
                      </div>

                      <div className="pt-4 border-t border-default-200">
                        <div className="flex justify-between items-center mb-4">
                          <p className="text-sm font-semibold">Specific Inscription Details</p>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="faded"
                            onPress={() =>
                              setSpecificDetails((prev) => [
                                ...prev,
                                { title: "", description: "" },
                              ])
                            }
                          >
                            <Plus size={16} />
                          </Button>
                        </div>

                        <div className="space-y-4">
                          {specificDetails.map((detail, index) => (
                            <div
                              key={index}
                              className="flex gap-2 items-start bg-default-50 p-3 rounded-md relative"
                            >
                              <Input
                                label="Title"
                                value={detail.title}
                                onChange={(e) => {
                                  setSpecificDetails((prev) => {
                                    const next = [...prev];
                                    next[index].title = e.target.value;
                                    return next;
                                  });
                                }}
                                className="flex-1"
                              />
                              <Input
                                label="Description"
                                value={detail.description}
                                onChange={(e) => {
                                  setSpecificDetails((prev) => {
                                    const next = [...prev];
                                    next[index].description = e.target.value;
                                    return next;
                                  });
                                }}
                                className="flex-1"
                              />
                              <Button
                                isIconOnly
                                size="sm"
                                className="mt-2"
                                color="danger"
                                variant="light"
                                onPress={() =>
                                  setSpecificDetails((prev) =>
                                    prev.filter((_, itemIndex) => itemIndex !== index)
                                  )
                                }
                              >
                                <Minus size={16} />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-6 w-full fade-in">
                      <p className="border-b border-default-200 pb-2 font-semibold">
                        Public Information
                      </p>

                      <Textarea
                        label="About Our Allies"
                        name="aboutOurAllies"
                        value={formData.aboutOurAllies}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, aboutOurAllies: e.target.value }))
                        }
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-sm font-semibold">Organizers</p>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="faded"
                              onPress={() => setOrganizers((prev) => [...prev, ""])}
                            >
                              <Plus size={16} />
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {organizers.map((organizer, index) => (
                              <div key={index} className="flex gap-2">
                                <Input
                                  value={organizer}
                                  placeholder={`Organizer ${index + 1}`}
                                  onChange={(e) => {
                                    setOrganizers((prev) => {
                                      const next = [...prev];
                                      next[index] = e.target.value;
                                      return next;
                                    });
                                  }}
                                />
                                <Button
                                  isIconOnly
                                  variant="light"
                                  color="danger"
                                  onPress={() =>
                                    setOrganizers((prev) =>
                                      prev.filter((_, itemIndex) => itemIndex !== index)
                                    )
                                  }
                                >
                                  <Minus size={16} />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-sm font-semibold">Collaborators</p>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="faded"
                              onPress={() => setCollaborators((prev) => [...prev, ""])}
                            >
                              <Plus size={16} />
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {collaborators.map((collaborator, index) => (
                              <div key={index} className="flex gap-2">
                                <Input
                                  value={collaborator}
                                  placeholder={`Collaborator ${index + 1}`}
                                  onChange={(e) => {
                                    setCollaborators((prev) => {
                                      const next = [...prev];
                                      next[index] = e.target.value;
                                      return next;
                                    });
                                  }}
                                />
                                <Button
                                  isIconOnly
                                  variant="light"
                                  color="danger"
                                  onPress={() =>
                                    setCollaborators((prev) =>
                                      prev.filter((_, itemIndex) => itemIndex !== index)
                                    )
                                  }
                                >
                                  <Minus size={16} />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-default-200">
                        <div className="flex justify-between items-center mb-4">
                          <p className="text-sm font-semibold">Awards</p>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="faded"
                            onPress={() =>
                              setAwards((prev) => {
                                if (prev.length >= 4) {
                                  return prev;
                                }
                                return [
                                  ...prev,
                                  {
                                    title: "",
                                    description: "",
                                    value: "",
                                    position: prev.length + 1,
                                    categoryId: "",
                                  },
                                ];
                              })
                            }
                          >
                            <Plus size={16} />
                          </Button>
                        </div>

                        <div className="space-y-4">
                          {awards.map((award, index) => (
                            <div
                              key={index}
                              className="flex flex-col gap-3 bg-default-50 p-4 rounded-md relative border border-default-200"
                            >
                              <div className="absolute top-2 right-2">
                                <Button
                                  isIconOnly
                                  size="sm"
                                  color="danger"
                                  variant="light"
                                  onPress={() =>
                                    setAwards((prev) =>
                                      prev
                                        .filter((_, itemIndex) => itemIndex !== index)
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

                <ModalFooter>
                  {step > 1 && (
                    <Button
                      type="button"
                      variant="flat"
                      onPress={() => setStep((prev) => Math.max(prev - 1, 1))}
                    >
                      Back
                    </Button>
                  )}

                  {step < 3 ? (
                    <Button type="submit">Next</Button>
                  ) : (
                    <Button
                      type="submit"
                      isLoading={updateEventMutation.isPending}
                      disabled={updateEventMutation.isPending}
                    >
                      Save Changes
                    </Button>
                  )}

                </ModalFooter>
              </Form>
            );
          }}
        </ModalContent>
      </Modal>
    </>
  );
};
