"use client";

import { useSearchParams } from "next/navigation";

import { ContentLayout } from "@/components/layouts/content-layout";
import '@/features/landing/index.css';
import { ProjectsTable } from "@/features/assignments/components/project-table";
import { AssignJudgesPanel } from "@/features/assignments/components/assign-judges-panel";
import { useState } from "react";
import { EventsDropdown } from "@/features/projects/components/events-dropdown";
import { ProjectPanel } from "@/features/assignments/components/project-panel";
import { ProjectsCard } from "@/features/assignments/components/project-card";


export const Assignments = () => {
  const searchParams = useSearchParams();
  const eventId = searchParams?.get("event");
  const [activePanel, setActivePanel] = useState<{type: "assign" | "view" | null; project: any | null;} | null>(null);

  return (
    <ContentLayout title="Assignments">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <EventsDropdown />
      </div>
      <div className="hidden lg:flex h-[70vh] mt-5">
          <div className={`transition-all ${activePanel ? "w-[65%]" : "w-full"}`}>
            <ProjectsTable 
              onSelectProject={(project) => setActivePanel({ type: "assign", project })} 
              onViewProject={ (project) => setActivePanel({ type: 'view', project }) } />
          </div>

        {activePanel?.type === 'assign' && (
          <div className="h-[70vh] w-[35%] min-w-[380px] border-white/10">
            <AssignJudgesPanel
              project={ activePanel.project }
              onClose={ () => setActivePanel(null) }
            />
          </div>
        )}
        {activePanel?.type === 'view' && (
          <div className="h-[70vh] w-[35%] min-w-[380px] border-white/10">
            <ProjectPanel
              project = { activePanel.project }
              onClose = { () => setActivePanel(null) }
            />
          </div>
        )}
      </div>
      <div className="flex flex-col">
        <ProjectsCard/>
      </div>
    </ContentLayout>
  );
};

export default Assignments