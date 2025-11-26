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
import { Select, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/utils/cn";

import { useCourse } from "../api/get-course";
import {
  updateCourseInputSchema,
  useUpdateCourse,
} from "../api/update-course";

import { useEvents } from "@/features/events/api/get-events";

type UpdateCourseProps = {
  courseId: number;
};

export const UpdateCourse = ({ courseId }: UpdateCourseProps) => {
  const { addNotification } = useNotifications();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();

  const courseQuery = useCourse({ courseId });
  const updateCourseMutation = useUpdateCourse({
    mutationConfig: {
      onSuccess: () => {
        addNotification({
          type: "success",
          title: "Course Updated",
        });
        onClose();
      },
    },
  });

  const eventsQuery = useEvents({ page: 1 });

  const course = courseQuery.data?.data;
  const events = eventsQuery.data?.data || [];

  return (
    <>
      <Button
        variant="shadow"
        className="w-full"
        size="sm"
        onPress={() => {
          courseQuery.refetch();
          onOpen();
        }}
        startContent={<SquarePen size={16} />}
      >
        Edit course
      </Button>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
        <ModalContent>
          {(onClose) => {
            if (courseQuery.isLoading) {
              return (
                <>
                  <ModalHeader>Update Course</ModalHeader>
                  <ModalBody className="flex items-center justify-center py-12">
                    <div>Loading...</div>
                  </ModalBody>
                </>
              );
            }

            if (!course) {
              return (
                <>
                  <ModalHeader>Update Course</ModalHeader>
                  <ModalBody>
                    <p>Course not found</p>
                  </ModalBody>
                  <ModalFooter>
                    <Button onPress={onClose}>Close</Button>
                  </ModalFooter>
                </>
              );
            }

            return (
            <Form
              key={`update-course-${courseId}-${course?.id}`}
              id="update-course"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const formData = new FormData(form);

                const rawData = Object.fromEntries(formData);

                const data = {
                  id: course.id,
                  code: rawData.code,
                  description: rawData.description,
                  active: rawData.active === "true",
                };

                const values = await updateCourseInputSchema.parseAsync(data);

                await updateCourseMutation.mutateAsync({
                  data: values,
                });
              }}
            >
              <ModalHeader className="flex flex-col gap-1">
                Update Course
              </ModalHeader>

              <ModalBody className="space-y-4 w-full">
                {/* Event Select */}
                <Select
                  label="Event"
                  name="eventId"
                  placeholder="Select an event"
                  defaultSelectedKeys={
                    course?.eventId ? [String(course.eventId)] : []
                  }
                  isLoading={eventsQuery.isLoading}
                >
                  {events.map((event) => (
                    <SelectItem key={event.id}>{event.name}</SelectItem>
                  ))}
                </Select>

                <Input
                  label="Course code"
                  name="code"
                  defaultValue={course?.code ?? ""}
                  isRequired
                />

                <Textarea
                  label="Description"
                  name="description"
                  defaultValue={course?.description ?? ""}
                  isRequired
                />

                <Switch
                  name="active"
                  value="true"
                  defaultSelected={course?.active}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2`}
                >
                  <div className="flex flex-col gap-1">
                    <p className="text-medium">Active</p>
                  </div>
                </Switch>
              </ModalBody>

              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={updateCourseMutation.isPending}
                  disabled={updateCourseMutation.isPending}
                >
                  Save Changes
                </Button>
              </ModalFooter>
            </Form>
            );
          }}
        </ModalContent>
      </Modal>
    </>
  );
};
