'use client';

import { Pen } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Drawer, DrawerBody, DrawerContent, DrawerFooter, DrawerHeader } from '@/components/ui/drawer';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@/components/ui/modal';
import { useNotifications } from '@/components/ui/notifications';
import { useUser } from '@/lib/auth';
import { useDisclosure } from '@/hooks/use-disclosure';
import { useIsMobile } from '@/hooks/use-mobile';

import {
  updateProfileInputSchema,
  useUpdateProfile,
} from '../api/update-profile';


export const UpdateProfile = () => {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const user = useUser();
  const isMobile = useIsMobile();
  const { addNotification } = useNotifications();
  const updateProfileMutation = useUpdateProfile({
    mutationConfig: {
      onSuccess: () => {
        addNotification({
          type: 'success',
          title: 'Profile Updated',
        });
        onClose();
      },
    },
  });

  const formContent = (onClose: () => void) => (
    <Form
      id="update-profile"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        const values = await updateProfileInputSchema.parseAsync(data);
        await updateProfileMutation.mutateAsync({ data: values });
      }}
    >
      {isMobile ? (
        <>
          <DrawerHeader className="flex flex-col gap-1">Update Profile</DrawerHeader>
          <DrawerBody className="w-full space-y-4">
            <Input
              name="firstName"
              label="First Name"
              defaultValue={user.data?.firstName ?? ''}
            />
            <Input
              name="lastName"
              label="Last Name"
              defaultValue={user.data?.lastName ?? ''}
            />
            <Input
              name="email"
              label="Email Address"
              type="email"
              defaultValue={user.data?.email ?? ''}
            />
          </DrawerBody>
          <DrawerFooter>
            <Button color="danger" variant="flat" onPress={onClose}>
              Close
            </Button>
            <Button color="primary" type="submit" isLoading={updateProfileMutation.isPending} disabled={updateProfileMutation.isPending}>
              Submit
            </Button>
          </DrawerFooter>
        </>
      ) : (
        <>
          <ModalHeader className="flex flex-col gap-1">Update Profile</ModalHeader>
          <ModalBody className="w-full space-y-4">
            <Input
              name="firstName"
              label="First Name"
              defaultValue={user.data?.firstName ?? ''}
            />
            <Input
              name="lastName"
              label="Last Name"
              defaultValue={user.data?.lastName ?? ''}
            />
            <Input
              name="email"
              label="Email Address"
              type="email"
              defaultValue={user.data?.email ?? ''}
            />
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="flat" onPress={onClose}>
              Close
            </Button>
            <Button color="primary" type="submit" isLoading={updateProfileMutation.isPending} disabled={updateProfileMutation.isPending}>
              Submit
            </Button>
          </ModalFooter>
        </>
      )}
    </Form>
  );

  return (
    <>
      <Button size="sm" onPress={() => onOpen()} startContent={<Pen className="size-4" />}>
        Update Profile
      </Button>
      {isMobile ? (
        <Drawer isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur" placement="bottom">
          <DrawerContent>
            {(onClose) => formContent(onClose)}
          </DrawerContent>
        </Drawer>
      ) : (
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
          <ModalContent>
            {(onClose) => formContent(onClose)}
          </ModalContent>
        </Modal>
      )}
    </>
  );
};