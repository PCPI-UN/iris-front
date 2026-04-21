"use client";

import { SquarePen } from "lucide-react";

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
import { canUpdateProject } from "@/lib/authorization";

import { useProject } from "../api/get-project";
import {
  updateProjectInputSchema,
  useUpdateProject,
} from "../api/update-project";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

type UpdateProjectProps = {
  projectId: string;
};

export const UpdateProject = ({ projectId }: UpdateProjectProps) => {
  const { addNotification } = useNotifications();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const projectQuery = useProject({ projectId });
  const updateProjectMutation = useUpdateProject({
    mutationConfig: {
      onSuccess: () => {
        addNotification({
          type: "success",
          title: "Project Updated",
        });
        onClose();
      },
    },
  });

  const user = useUser();

  if (!canUpdateProject(user?.data)) {
    return null;
  }

  const project = projectQuery.data;

  return (
    <>
      <Button
        variant="shadow"
        className="w-full"
        size="sm"
        onMouseEnter={() => projectQuery.refetch()}
        onPress={() => onOpen()}
        startContent={<SquarePen size={16} />}
      >
        Update Project
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
        <ModalContent>
          {(onClose) => (
            <Form
              key={`update-project-${projectId}-${isOpen}`}
              id="update-project"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);

                const rawData = Object.fromEntries(formData);
                const data = {
                  ...rawData,
                  isPublic: rawData.isPublic === "",
                };

                const values = await updateProjectInputSchema.parseAsync(data);
                await updateProjectMutation.mutateAsync({
                  data: values,
                  projectId,
                });
              }}
            >
              <ModalHeader className="flex flex-col gap-1">
                Update Project
              </ModalHeader>
              <ModalBody className="space-y-4 w-full">
                <Input
                  label="Title"
                  name="title"
                  defaultValue={project?.name ?? ""}
                  maxLength={255}
                  isRequired
                />
                <Textarea
                  label="Description"
                  name="description"
                  defaultValue={project?.description ?? ""}
                  maxLength={3000}
                  isRequired
                />
                <Input
                  label="Event ID"
                  name="eventId"
                  defaultValue={String(project?.eventId ?? "")}
                />
              </ModalBody>
              <ModalFooter>
                <Button
                  type="submit"
                  isLoading={updateProjectMutation.isPending}
                  disabled={updateProjectMutation.isPending}
                >
                  Save Changes
                </Button>
              </ModalFooter>
            </Form>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
