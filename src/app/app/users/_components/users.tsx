"use client";

import { ContentLayout } from "@/components/layouts/content-layout";
import { UsersRoles } from "@/features/users/components/users-roles";

export const Users = () => (
  <ContentLayout title="Usuarios y roles">
    <UsersRoles />
  </ContentLayout>
);
