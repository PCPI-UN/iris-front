"use client";

import { ContentLayout } from "@/components/layouts/content-layout";
import '@/features/landing/index.css';
import { ProjectsTable } from "@/features/assignments/components/project-table";
import { AssignJudgesPanel } from "@/features/assignments/components/assign-judges-panel";
import { useState } from "react";
import { EventsDropdown } from "@/features/projects/components/events-dropdown";
import { ProjectPanel } from "@/features/assignments/components/project-panel";
import { ProjectsCard } from "@/features/assignments/components/project-card";


export const Assignments = () => {
  const [activePanel, setActivePanel] = useState<{type: "assign" | "view" | null; project: any | null;} | null>(null);

  return (
    <ContentLayout title="Assignments">
      <EventsDropdown />
      <div className="hidden xl:flex h-[70vh] mt-5">
          <div className={`transition-all ${activePanel ? "w-[65%]" : "w-full"} duration-400`}>
            <ProjectsTable 
              onSelectProject={(project) => setActivePanel({ type: "assign", project })} 
              onViewProject={ (project) => setActivePanel({ type: 'view', project }) } />
          </div>

        {activePanel?.type === 'assign' && (
          <div className="h-[70vh] w-[35%] border-white/10">
            <AssignJudgesPanel
              project={ activePanel.project }
              onClose={ () => setActivePanel(null) }
            />
          </div>
        )}
        {activePanel?.type === 'view' && (
          <div className="h-[70vh] w-[35%] border-white/10">
            <ProjectPanel
              project = { activePanel.project }
              onClose = { () => setActivePanel(null) }
            />
          </div>
        )}
      </div>
      <div className="flex flex-col xl:hidden">
        <ProjectsCard/>
      </div>
    </ContentLayout>
  );
};

export default Assignments