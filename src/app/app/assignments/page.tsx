"use client";

import { useState } from "react";
import { ProjectsTable } from "@/features/assignments/components/project-table";
import { AssignJudgesPanel } from "@/features/assignments/components/assign-judges-panel";

export const AssignJudgesPage = () => {
  const [selectedProject, setSelectedProject] = useState<any | null>(null);

  return (
    <div className="flex h-full">

      {/* 🧾 Tabla */}
      <div className={`transition-all ${selectedProject ? "w-[65%]" : "w-full"}`}>
        <ProjectsTable onSelectProject={setSelectedProject} />
      </div>

      {/* 👉 Panel lateral */}
      {selectedProject && (
        <div className="w-[35%] min-w-[380px] border-l border-white/10">
          <AssignJudgesPanel
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
          />
        </div>
      )}
    </div>
  );
};

export default AssignJudgesPage