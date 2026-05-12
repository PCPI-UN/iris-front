"use client";

import { ContentLayout } from "@/components/layouts/content-layout";
import { CriteriaList } from "@/features/criteria/components/criteria-list";
import { CreateCriteria } from "@/features/criteria/components/create-criteria";
import "@/features/landing/index.css";

export const Criteria = () => {
  return (
    <ContentLayout title="Criterios de Evaluación">
      <p className="text-gray-300 mb-4 text-sm sm:text-base">
        Gestiona los criterios de evaluación y sus pesos
      </p>
      <div className="flex justify-end gap-2 mb-4">
        <CreateCriteria />
      </div>
      <div className="mt-4">
        <CriteriaList />
      </div>
    </ContentLayout>
  );
};
