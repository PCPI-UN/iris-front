"use client";

import { FilePlus2, FileSpreadsheet } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { Can } from "@/components/auth/can";
import { ContentLayout } from "@/components/layouts/content-layout";
import { Button } from "@/components/ui/button";
import { paths } from "@/config/paths";
import { parseValidEventId } from "@/features/imports/utils/excel-file";
import { PERMISSIONS } from "@/lib/authorization";
import { ProjectList } from "@/features/projects/components/project-list";
import { EventsDropdown } from "@/features/projects/components/events-dropdown";
import "@/features/landing/index.css";

export const Projects = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = parseValidEventId(searchParams?.get("event"));
  const needsEventHint = eventId ? undefined : "Selecciona un evento primero";

  return (
    <ContentLayout title="Proyectos">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <EventsDropdown />
        <Can permission={PERMISSIONS.manageProjects}>
          <div className="flex flex-wrap gap-2">
            <Button
              color="primary"
              startContent={<FilePlus2 className="h-4 w-4" />}
              isDisabled={!eventId}
              title={needsEventHint}
              onPress={() => router.push(paths.app.projectNew.getHref(eventId))}
            >
              Crear proyecto
            </Button>
            <Button
              variant="bordered"
              startContent={<FileSpreadsheet className="h-4 w-4" />}
              isDisabled={!eventId}
              title={needsEventHint}
              onPress={() => router.push(paths.app.projectImport.getHref(eventId))}
            >
              Carga masiva
            </Button>
          </div>
        </Can>
      </div>
      <div className="mt-4">
        <ProjectList />
      </div>
    </ContentLayout>
  );
};
