"use client";

import { Button } from "@/components/ui/button";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal";
import { useDisclosure } from "@/hooks/use-disclosure";
import { Project } from "@/types/api";
import { ArrowLeft, Eye, FileText, Pencil } from "lucide-react";
import { useState } from "react";
import { ParticipantsDetails } from "./participants-details";
import { documentLink } from "@/lib/document-link";
import { EditTutors } from "./edit-tutors";
import { TutorsList } from "./tutors-list";
import { Can } from "@/components/auth/can";
import { PERMISSIONS } from "@/lib/authorization";
import { ProjectChangeLog } from "./project-change-log";
import { AdminProjectEditor } from "./admin-edit/admin-project-editor";
import {
  DOCUMENT_TYPE_LABELS,
  normalizeDocumentType,
} from "../api/admin-project-documents";
import { useCategoriesByEvent } from "../api/use-category";

/** Code of the category (course) of the project; rendered only while the modal is open */
const ProjectCategory = ({ project }: { project: Project }) => {
  const { data } = useCategoriesByEvent(project.eventId);
  const courseId = project.courseId ?? project.categoryId;
  const category = (data?.categories ?? []).find(
    (item: { id: number | string }) => String(item.id) === String(courseId),
  );

  if (!courseId) return null;

  return (
    <div className="inline-flex items-center rounded-full border border-white/20 px-3 py-1 text-sm">
      <span className="mr-1 text-white/70">Categoría:</span>
      <span>{category?.code ?? `#${courseId}`}</span>
    </div>
  );
};

export const ViewDetails = ({project} : {project: Project}) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  /** Administrative edit mode (manage:projects) */
  const [isEditing, setIsEditing] = useState(false);

  const handleOpenChange = () => {
    // Closing the modal leaves the edit mode
    if (isOpen) setIsEditing(false);
    onOpenChange();
  };

  return (
    <>
      <Button size="sm" onPress={onOpen} className={`w-full bg-transparent border border-[#ffffff30] py-5 text-white hover:bg-[#eeeeee30]`}>
        <Eye className="hidden md:flex h-4 w-4"/>
        <h2 className="md:hidden flex">Ver detalles</h2>
      </Button>

      <Modal isOpen={isOpen} onOpenChange={handleOpenChange} className="m-auto mx-5 lg:max-w-[50vw] max-h-[70vh]">
        <ModalContent className="rounded-2xl overflow-hidden">
          {(onClose) => (

            <>
              <ModalHeader className="flex flex-wrap items-center justify-between gap-2 pr-12">
                <span>{isEditing ? "Editar proyecto" : "Detalles del proyecto"}</span>
                <Can permission={PERMISSIONS.manageProjects}>
                  <Button
                    size="sm"
                    startContent={
                      isEditing ? <ArrowLeft className="h-4 w-4" /> : <Pencil className="h-4 w-4" />
                    }
                    variant="flat"
                    onPress={() => setIsEditing((editing) => !editing)}
                  >
                    {isEditing ? "Volver al detalle" : "Editar"}
                  </Button>
                </Can>
              </ModalHeader>
              {isEditing ? (
                <ModalBody className="space-y-5 overflow-y-auto">
                  <AdminProjectEditor projectId={project.id} />
                  <section className="space-y-2">
                    <h2 className="font-medium bg-gradient-to-br from-white via-white/80 to-white bg-clip-text text-transparent inline-block">Historial de cambios</h2>
                    <ProjectChangeLog projectId={project.id} />
                  </section>
                </ModalBody>
              ) : (
              <ModalBody className="space-y-5 overflow-y-auto">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-sm font-semibold text-cyan-100 shadow-sm shadow-cyan-400/10">
                    <span className="mr-1 text-cyan-200/80">Código:</span>
                    <span>{project.projectCode ?? "—"}</span>
                  </div>
                  <h2 className="text-2xl font-bold">{project.name}</h2>
                  <ProjectCategory project={project} />
                </div>
                <section className="space-y-2">
                    <h2 className="font-medium bg-gradient-to-br from-white via-white/80 to-white bg-clip-text text-transparent inline-block">Descripción</h2>
                    <p className="text-sm font-light">
                        {project.description}
                    </p>
                </section>

                <section className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-medium bg-gradient-to-br from-white via-white/80 to-white bg-clip-text text-transparent inline-block">Tutores</h2>
                    {/* With manage:projects the tutors are edited in the Tutores tab of the edit mode */}
                    <Can
                      fallback={<EditTutors project={project} />}
                      permission={PERMISSIONS.manageProjects}
                    >
                      {null}
                    </Can>
                  </div>
                  <TutorsList tutors={project.tutors} />
                </section>

                <section className="space-y-2">
                  <ParticipantsDetails
                    confirmedParticipants={project.participants}
                    pendingParticipants={project.pendingParticipants}
                  />
                </section>

                <section className="space-y-2">
                  <h2 className="font-medium bg-gradient-to-br from-white via-white/80 to-white bg-clip-text text-transparent inline-block">Documentos</h2>
                  {project.documents && project.documents.length > 0 && (
                    <div className="space-y-2 pt-2">
                      {/* Lista de documentos */}
                      <div className="space-y-3 pt-2">
                        {project.documents.map((doc, index) => {
                          const documentType = normalizeDocumentType(doc.type);
                          const readableType = documentType
                            ? DOCUMENT_TYPE_LABELS[documentType]
                            : doc.type;

                          return (
                            <button
                              key={index}
                              type="button"
                              className="w-full flex items-center justify-between text-left p-3 hover:bg-gradient-to-br from-cyan-400/10 to-cyan-400/5 rounded-lg border border-gray-100/20 transition-all duration-500 cursor-pointer"
                              onClick={() => window.open(documentLink(doc), "_blank")}
                            >
                              <div className="flex items-center gap-2 text-sm">
                                <FileText className="h-4 w-4 text-primary" />
                                <span className="font-medium">{readableType}</span>
                              </div>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 text-muted-foreground"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </section>
                <section className="space-y-2">
                  {project.reason && (
                    <>
                      <h2 className="font-medium bg-gradient-to-br from-white via-white/80 to-white bg-clip-text text-transparent inline-block">Comentarios</h2> 
                      <p className="text-sm">{project.reason}</p>
                    </>
                  )}
                </section>
                <Can permission={PERMISSIONS.manageProjects}>
                  <section className="space-y-2">
                    <h2 className="font-medium bg-gradient-to-br from-white via-white/80 to-white bg-clip-text text-transparent inline-block">Historial de cambios</h2>
                    <ProjectChangeLog projectId={project.id} />
                  </section>
                </Can>
              </ModalBody>
              )}
              <ModalFooter />
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};