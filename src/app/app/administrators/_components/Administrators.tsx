"use client";

import { ContentLayout } from "@/components/layouts/content-layout";
import { AdministratorsList } from "@/features/administrators/components/administrators-list";
import "@/features/landing/index.css";

export const Administrators = () => {
  return (
    <ContentLayout title="Administradores">
      <AdministratorsList />
    </ContentLayout>
  );
};
