"use client";

import { ContentLayout } from "@/components/layouts/content-layout";
import { JuriesList } from "@/features/juries/components/juries-list";
import "@/features/landing/index.css";

export const Juries = () => {
  return (
    <ContentLayout title="Jurados">
      <JuriesList />
    </ContentLayout>
  );
};
