"use client";

import { Button } from "@/components/ui/button";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal";
import { useDisclosure } from "@/hooks/use-disclosure";
import { Project } from "@/types/api";
import { Eye, FileText } from "lucide-react";
import { ParticipantsDetails } from "./participants-details";

export const ViewDetails = ({project} : {project: Project}) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  return (
    <>
      <Button size="sm" onPress={onOpen} className={`w-full bg-transparent border border-[#ffffff30] py-5 text-white hover:bg-[#eeeeee30]`}>
        <Eye className="hidden md:flex h-4 w-4"/>
        <h2 className="md:hidden flex">Ver detalles</h2>
      </Button>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} className="m-auto mx-5 lg:max-w-[50vw] max-h-[70vh]">
        <ModalContent className="rounded-2xl overflow-hidden">
          {(onClose) => (

            <>
              <ModalHeader>Detalles del proyecto</ModalHeader>
              <ModalBody className="space-y-5 overflow-y-auto">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-sm font-semibold text-cyan-100 shadow-sm shadow-cyan-400/10">
                    <span className="mr-1 text-cyan-200/80">Código:</span>
                    <span>{project.projectCode ?? "—"}</span>
                  </div>
                  <h2 className="text-2xl font-bold">{project.name}</h2>
                </div>
                <section className="space-y-2">
                    <h2 className="font-medium bg-gradient-to-br from-white via-white/80 to-white bg-clip-text text-transparent inline-block">Description</h2>
                    <p className="text-sm font-light">
                        {project.description}
                    </p>
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
                          const readableType =
                            doc.type === "POSTER"
                              ? "Poster"
                              : doc.type === "ASSOCIATED_DOCUMENT"
                              ? "Documento asociado"
                              : doc.type;

                          return (
                            <div
                              key={index}
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
                  {project.reason && (
                    <>
                      <h2 className="font-medium bg-gradient-to-br from-white via-white/80 to-white bg-clip-text text-transparent inline-block">Comentarios</h2> 
                      <p className="text-sm">{project.reason}</p>
                    </>
                  )}
                </section>
              </ModalBody>
              <ModalFooter />
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};