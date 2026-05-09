"use client";

import { useSearchParams } from "next/navigation";

import { ContentLayout } from "@/components/layouts/content-layout";
import { ProjectList } from "@/features/projects/components/project-list";
import { EventsDropdown } from "@/features/projects/components/events-dropdown";
import '@/features/landing/index.css';

export const Projects = () => {

  return (
    <ContentLayout title="Projects">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <EventsDropdown />
      </div>
      <div className="mt-4">
        <ProjectList />
      </div>
    </ContentLayout>
  );
};
