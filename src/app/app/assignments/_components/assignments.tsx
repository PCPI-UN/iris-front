"use client";

import { FileSpreadsheet } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Can } from "@/components/auth/can";
import { ContentLayout } from "@/components/layouts/content-layout";
import { Button } from "@/components/ui/button";
import { paths } from "@/config/paths";
import { AssignJudgesPanel } from "@/features/assignments/components/assign-judges-panel";
import { ProjectsCard } from "@/features/assignments/components/project-card";
import { ProjectPanel } from "@/features/assignments/components/project-panel";
import { ProjectsTable } from "@/features/assignments/components/project-table";
import "@/features/landing/index.css";
import { EventsDropdown } from "@/features/projects/components/events-dropdown";
import { PERMISSIONS } from "@/lib/authorization";

export const Assignments = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedEventId = searchParams?.get("event");

  const [activePanel, setActivePanel] = useState<{
    type: "assign" | "view" | null;
    project: any | null;
  } | null>(null);

  return (
    <ContentLayout title="Asignaciones">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex-1">
          <EventsDropdown />
        </div>
        <Can permission={PERMISSIONS.manageEvents}>
          <Button
            color="primary"
            variant="flat"
            startContent={<FileSpreadsheet className="h-4 w-4" />}
            onPress={() =>
              router.push(paths.app.assignmentsImport.getHref(selectedEventId))
            }
          >
            Importar desde Excel
          </Button>
        </Can>
      </div>
      <div className="hidden xl:flex h-[70vh] mt-5">
        <div
          className={`transition-all ${activePanel ? "w-[65%]" : "w-full"} duration-400`}
        >
          <ProjectsTable
            onSelectProject={(project) =>
              setActivePanel({ type: "assign", project })
            }
            onViewProject={(project) =>
              setActivePanel({ type: "view", project })
            }
          />
        </div>

        {activePanel?.type === "assign" && (
          <div className="h-[70vh] w-[35%] border-white/10">
            <AssignJudgesPanel
              project={activePanel.project}
              onClose={() => setActivePanel(null)}
            />
          </div>
        )}
        {activePanel?.type === "view" && (
          <div className="h-[70vh] w-[35%] border-white/10">
            <ProjectPanel
              project={activePanel.project}
              onClose={() => setActivePanel(null)}
            />
          </div>
        )}
      </div>
      <div className="flex flex-col xl:hidden">
        <ProjectsCard />
      </div>
    </ContentLayout>
  );
};

export default Assignments;
