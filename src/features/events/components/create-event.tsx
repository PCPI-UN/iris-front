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
  top: number;
  description: string;
};

export const CreateEvent = () => {
  const { addNotification } = useNotifications();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<any>({
    isPubliclyJoinable: true,
    evaluationsOpened: false,
    eventType: "Exhibition"
  });

  const [specificDetails, setSpecificDetails] = useState([{ title: "", description: "" }]);
  const [organizations, setOrganizations] = useState([""]);
  const [collaborators, setCollaborators] = useState([""]);
  const [awards, setAwards] = useState<Award[]>([{ top: 1, description: "" }]);

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
    setFormData({ isPubliclyJoinable: true, evaluationsOpened: false, eventType: "Exhibition" });
    setSpecificDetails([{ title: "", description: "" }]);
    setOrganizations([""]);
    setCollaborators([""]);
    setAwards([{ top: 1, description: "" }]);
  };

  const handleNextStep = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const currentFormData = new FormData(form);
    const rawData = Object.fromEntries(currentFormData);
    const updatedForm = { ...formData, ...rawData };

    if (rawData.isPubliclyJoinable !== undefined) updatedForm.isPubliclyJoinable = true;
    else updatedForm.isPubliclyJoinable = false;

    setFormData(updatedForm);
    setStep((prev) => prev + 1);
  };

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const dataToSubmit = {
        ...formData,
        evaluationsOpened: false,
        specificInscriptionDetails: specificDetails.filter(d => d.title && d.description),
        organizations: organizations.filter(o => o.trim() !== ""),
        collaborators: collaborators.filter(c => c.trim() !== ""),
        awards: awards.filter(a => a.description).map(a => ({
          ...a,
          top: Number(a.top) || 1
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
                      placeholder="Enter nombre del evento"
                      isRequired
                      value={formData.name || ""}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />

                    <div className="flex flex-col sm:flex-row gap-4">
                      <Input
                        label="Location"
                        name="location"
                        placeholder="Enter Event Location"
                        isRequired
                        value={formData.location || ""}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="flex-1"
                      />
                      <Input
                        label="Location detail (Optional)"
                        name="locationDetail"
                        placeholder="Enter Event Location detail"
                        value={formData.locationDetail || ""}
                        onChange={(e) => setFormData({ ...formData, locationDetail: e.target.value })}
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
                        <SelectItem key="Exhibition">Exhibition</SelectItem>
                        <SelectItem key="Competition">Competition</SelectItem>
                      </Select>
                    </div>

                    <div className="pt-2 border-t border-default-200">
                      <p className="text-sm font-semibold mb-2">Event Details</p>
                      <Textarea
                        label="Description"
                        name="description"
                        placeholder="Enter Event General Description"
                        isRequired
                        value={formData.description || ""}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        maxLength={1000}
                      />
                    </div>

                    <div className="flex items-center gap-2 py-2">
                      <span className="text-sm font-medium">Public For Join</span>
                      <Switch
                        size="sm"
                        name="isPubliclyJoinable"
                        defaultSelected={formData.isPubliclyJoinable}
                        onValueChange={(isSelected) =>
                          setFormData({ ...formData, isPubliclyJoinable: isSelected })
                        }
                        color="success"
                      />
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
                      placeholder="Enter all the details of inscription requirements for participants."
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
                        label="Cost"
                        name="cost"
                        type="number"
                        placeholder="No cost"
                        value={formData.cost || ""}
                        onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                        className="flex-1"
                      />
                      <Input
                        label="Minimum Team Size"
                        name="minimumTeamSize"
                        type="number"
                        placeholder="Enter min size"
                        value={formData.minimumTeamSize || ""}
                        onChange={(e) => setFormData({ ...formData, minimumTeamSize: e.target.value })}
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
                              placeholder="Enter Title Specific Detail"
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
                              placeholder="Enter Description of Specific Detail"
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
                      placeholder="Information about partners and allies"
                      value={formData.aboutOurAllies || ""}
                      onChange={(e) => setFormData({ ...formData, aboutOurAllies: e.target.value })}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Organizations */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-semibold">Organizations</p>
                          <Button isIconOnly size="sm" variant="faded" onPress={() => setOrganizations([...organizations, ""])}>
                            <Plus size={16} />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {organizations.map((org, index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                placeholder={`Organization ${index + 1}`}
                                value={org}
                                onChange={(e) => {
                                  const newArr = [...organizations];
                                  newArr[index] = e.target.value;
                                  setOrganizations(newArr);
                                }}
                              />
                              <Button isIconOnly variant="light" color="danger" onPress={() => setOrganizations(organizations.filter((_, i) => i !== index))}>
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
                        <Button isIconOnly size="sm" variant="faded" onPress={() => awards.length < 4 && setAwards([...awards, { top: awards.length + 1, description: "" }])}>
                          <Plus size={16} />
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {awards.map((award, index) => (
                          <div key={index} className="flex flex-col gap-3 bg-default-50 p-4 rounded-md relative border border-default-200">
                            <div className="absolute top-2 right-2">
                              <Button isIconOnly size="sm" color="danger" variant="light" onPress={() => setAwards(awards.filter((_, i) => i !== index))}>
                                <Minus size={14} />
                              </Button>
                            </div>
                            <div className="flex flex-row gap-4 w-full pr-8">
                              {/* TOP BADGE */}
                              <div className="flex flex-col items-center justify-center bg-default-100 rounded-md px-3 py-2 min-w-[80px]">
                                <span className="text-sm text-default-500 font-semibold uppercase tracking-wider">Top</span>
                                <span className="text-4xl font-extrabold text-primary">{award.top}</span>
                              </div>
                              <Textarea
                                label="Description for TOP Award"
                                placeholder="Description..."
                                value={award.description}
                                onChange={(e) => {
                                  const newArr = [...awards];
                                  newArr[index].description = e.target.value;
                                  setAwards(newArr);
                                }}
                                className="flex-1"
                              />
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
