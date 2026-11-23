"use client";

import { Tab, Tabs } from "@heroui/react";

import { useProject } from "../../api/get-project";

import { AdminProjectDocuments } from "./admin-project-documents";
import {
  AdminInfoProject,
  AdminProjectInfoForm,
} from "./admin-project-info-form";
import { AdminProjectParticipants } from "./admin-project-participants";
import { AdminProjectTutors } from "./admin-project-tutors";

import { Spinner } from "@/components/ui/spinner";
import { ProjectTutor } from "@/types/api";

/** GET /projects/:id as the gateway returns it (ProjectComplete) */
type AdminEditableProject = AdminInfoProject & {
  participants?: Array<{
    userId: number;
    studentCode?: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  }>;
  pendingParticipants?: Array<{
    pendingId: number;
    firstName?: string;
    lastName?: string;
    email?: string;
    studentCode?: string;
    status?: string | number;
  }>;
  tutors?: ProjectTutor[];
};

type AdminProjectEditorProps = {
  projectId: number;
};

/**
 * Administrative corrections of a project (manage:projects): basic data and category,
 * participants, tutors and documents. Every change is recorded in the change log.
 */
export const AdminProjectEditor = ({ projectId }: AdminProjectEditorProps) => {
  const projectQuery = useProject({ projectId: String(projectId) });
  const project = projectQuery.data as AdminEditableProject | null | undefined;

  if (projectQuery.isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Spinner size="sm" />
      </div>
    );
  }
  if (!project) {
    return (
      <p className="text-sm text-danger" role="alert">
        No se pudo cargar el proyecto.
      </p>
    );
  }

  return (
    <Tabs aria-label="Edición del proyecto" variant="underlined">
      <Tab key="info" title="Datos y categoría">
        {/* Remounts with the saved values after each change */}
        <AdminProjectInfoForm
          key={[
            project.name,
            project.description,
            project.projectCode,
            project.eventNumber,
            project.courseId ?? project.categoryId,
          ].join("|")}
          project={project}
        />
      </Tab>
      <Tab key="participants" title="Integrantes">
        <AdminProjectParticipants
          participants={project.participants ?? []}
          pendingParticipants={project.pendingParticipants ?? []}
          projectId={project.id}
        />
      </Tab>
      <Tab key="tutors" title="Tutores">
        {/* Remounts when the tutors change outside this form (another admin, the detail) */}
        <AdminProjectTutors
          key={JSON.stringify(project.tutors ?? [])}
          projectId={project.id}
          tutors={project.tutors ?? []}
        />
      </Tab>
      <Tab key="documents" title="Documentos">
        <AdminProjectDocuments projectId={project.id} />
      </Tab>
    </Tabs>
  );
};
