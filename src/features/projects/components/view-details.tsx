import { Button } from "@/components/ui/button";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal";
import { useDisclosure } from "@/hooks/use-disclosure";
import { useNotifications } from "@/components/ui/notifications";
import { useApproveProject } from "../api/approve-project";
import { useRejectProject } from "../api/reject-project";
import { useRequestChangesProject } from "../api/request-changes-project";
import { Project } from "@/types/api";
import { AvatarGroup } from "./avatar-icon";
import { FileText } from "lucide-react";
import { RejectProjectModal } from "./reject-modal";
import { RequestProjectModal } from "./request-change-modal";
import { ApproveProjectModal } from "./approve-modal";

export const ViewDetails = ({project} : {project: Project}) => {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const { addNotification } = useNotifications();
  const approveMutation = useApproveProject();
  const rejectMutation = useRejectProject();
  const requestChangeMutatcion = useRequestChangesProject();

  console.log("Este es un comentario", project.comment)

  return (
    <>
      <Button size="sm" onPress={onOpen} className={`w-full bg-transparent border border-[#ffffff30] py-5 text-white hover:bg-[#eeeeee30]`}>
        Ver detalles
      </Button>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} className="m-auto mx-5 lg:max-w-[50vw] max-h-[70vh] overflow-y-auto">
        <ModalContent>
          {(onClose) => (

            <>
              <ModalHeader>Detalles del proyecto</ModalHeader>
              <ModalBody className="space-y-5">
                <h2 className="text-2xl font-bold">{project.name}</h2>
                <section className="space-y-2">
                    <h2 className="font-medium bg-gradient-to-br from-white via-white/80 to-white bg-clip-text text-transparent inline-block">Description</h2>
                    <p className="text-sm font-light">
                        {project.description}
                    </p>
                </section>
                <section className="space-y-2">
                  <h2 className="font-medium bg-gradient-to-br from-white via-white/80 to-white bg-clip-text text-transparent inline-block">Equipo</h2>
                  <div className="space-y-4">
                  
                    {/* Desktop: AvatarGroup */}
                    <div className="hidden sm:block">
                      <AvatarGroup
                        participants={
                          (project.pendingParticipants?.length ?? 0) > 0
                            ? project.pendingParticipants.map(p => ({
                                name: `${p.firstName} ${p.lastName}`.trim()
                              }))
                            : project.participants.map(p => ({
                                name: `${p.firstName} ${p.lastName}`.trim()
                              }))
                        }
                        size={35}
                      />
                    </div>

                    {/* Mobile: Lista de nombres */}
                    <div className="sm:hidden space-y-2">
                      {((project.pendingParticipants?.length ?? 0) > 0
                        ? project.pendingParticipants
                        : project.participants
                      ).map((participant, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                            {participant.firstName[0]}
                            {participant.lastName[0]}
                          </div>
                          <span>{participant.firstName} {participant.lastName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="space-y-2">
                  <h2 className="font-medium bg-gradient-to-br from-white via-white/80 to-white bg-clip-text text-transparent inline-block">Documentos</h2>
                  {project.documents && project.documents.length > 0 && (
                    <div className="space-y-2 pt-2">
                      {/* Lista de documentos */}
                      <div className="space-y-3 pt-2">
                        {project.documents.map((doc) => {
                          const readableType =
                            doc.type === "POSTER"
                              ? "Poster"
                              : doc.type === "ASSOCIATED_DOCUMENT"
                              ? "Documento asociado"
                              : doc.type;

                          return (
                            <div
                              key={doc.url}
                              className="w-full flex items-center justify-between p-3 hover:bg-gradient-to-br from-cyan-400/10 to-cyan-400/5 rounded-lg border border-gray-100/20 transition-all duration-500 cursor-pointer"
                              onClick={() => window.open(doc.url, "_blank")}
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
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </section>
                <section className="space-y-2">
                  {
                  (project.comment === "" || project.comment === null) ?  null 
                    :
                    <h2 className="font-medium bg-gradient-to-br from-white via-white/80 to-white bg-clip-text text-transparent inline-block">Comentarios</h2>
                  }
                  <p className="text-sm">{project.comment}</p>
                  
                </section>
              </ModalBody>
              <ModalFooter>
                
                  {/* ---------- Acciones por estado ---------- */}
                
                  {project.state === "APPROVED" && (
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <RejectProjectModal projectId={project.id} />
                      <RequestProjectModal projectId={project.id}/>
                    </div>
                  )}

                  {project.state === "REQUEST_CHANGES" && (
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <RejectProjectModal projectId={project.id}/>
                      <ApproveProjectModal projectId={project.id}/>
                    </div>
                  )}
                  {project.state === "REJECTED" && (
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <RequestProjectModal projectId={project.id}/>
                      <ApproveProjectModal projectId={project.id}/>
                    </div>
                  )}
                
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
