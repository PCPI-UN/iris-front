"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { Pagination } from "@/components/ui/pagination";
import { useProjects } from "../api/get-projects";
import { ApproveProjectModal } from "./approve-modal";
import { RejectProjectModal } from "./reject-modal";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { GlassCard } from "@/features/landing/components/glass-card";
import { StatusBadge } from "@/components/ui/status-badge/status-badge";
import { stylesGradient } from "@/components/ui/status-badge/status-style";
import { RequestProjectModal } from "./request-change-modal";
import { ViewDetails } from "./view-details";
import { DataTable } from "@/components/data-table";
import { columnsProject } from "./columns-project-table";
import React from "react";
import { ParticipantsDetails } from "./participants-details";

//MOCKAPI -> category
//BACK -> courseId

export const ProjectList = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const page = searchParams?.get("page") ? Number(searchParams.get("page")) : 1;
  const eventId = searchParams?.get("event") ? Number(searchParams.get("event")) : undefined;
  const state = searchParams?.get("state") || "UNDER_REVIEW";
  const courseId = searchParams?.get("courseId") ? Number(searchParams.get("courseId")) : undefined;

  const projectsQuery = useProjects({ page, eventId, state, courseId });
  const projects = projectsQuery.data?.data;
  const meta = projectsQuery.data?.meta;

  
  {/* ======================== ACTIONS APPROVE, REJECT, REQUEST FOR TABLE ======================== */}
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const [action, setAction] = React.useState<"approve" | "reject" | "request" | null>(null);

  const handleApprove = (id: number) => {
    setSelectedId(id);
    setAction("approve");
  };

  const handleReject = (id: number) => {
    setSelectedId(id);
    setAction("reject");
  };

  const handleRequest = (id: number) => {
    setSelectedId(id);
    setAction("request");
  };
  {/* ======================== ACTIONS APPROVE, REJECT, REQUEST FOR TABLE ======================== */}
  const columns = columnsProject({onApprove: handleApprove, onReject: handleReject, onRequest: handleRequest,
  });

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    params.set("page", String(newPage));
    if (eventId) params.set("event", String(eventId));
    if (state) params.set("state", state);
    router.push(`?${params.toString()}`);
  };

  const handleStatusFilter = (newStatus: string | undefined) => {
    const params = new URLSearchParams();
    params.set("page", "1");
    if (eventId) params.set("event", String(eventId));
    if (newStatus) params.set("state", newStatus);
    if (courseId) params.set("courseId", String(courseId))
    router.push(`?${params.toString()}`);
  };

  
  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">

      {/* ======================== FILTERS ======================== */}
      <div className="grid md:grid-cols-4 items-center gap-3">
        <Button
          variant={state === "UNDER_REVIEW" ? "flat" : "bordered"}
          onClick={() => handleStatusFilter("UNDER_REVIEW")}
        >
          Under Review
        </Button>

        <Button
          variant={state === "APPROVED" ? "flat" : "bordered"}
          onClick={() => handleStatusFilter("APPROVED")}
        >
          Approved
        </Button>

        <Button
          variant={state === "REJECTED" ? "flat" : "bordered"}
          onClick={() => handleStatusFilter("REJECTED")}
        >
          Rejected
        </Button>

        <Button
          variant={state === "REQUEST_CHANGES" ? "flat" : "bordered"}
          onClick={() => handleStatusFilter("REQUEST_CHANGES")}
        >
          Changes required
        </Button>
      </div>

      {/* ======================== EVENT VALIDATION ======================== */}
      {!eventId && (
        <div className="text-center py-12 text-muted-foreground">
          Por favor selecciona un evento para ver los proyectos.
        </div>
      )}

      {/* ======================== LOADING ======================== */}
      {projectsQuery.isLoading && (
        <div className="flex h-48 w-full items-center justify-center">
          <Spinner size="lg" />
        </div>
      )}

      {/* ======================== NO PROJECTS ======================== */}
      {!projectsQuery.isLoading && projects?.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No hay proyectos con este estado.
        </div>
      )}

      {/* ======================== PROJECTS GRID ======================== */}
      {projects && projects.length > 0 && (
        <div className="grid md:hidden gap-4 sm:gap-6 md:gap-8 grid-cols-1 lg:grid-cols-2">
          {projects.map((project) => (
            <GlassCard
              key={project.id}
              className="group relative overflow-hidden w-full rounded-xl cursor-pointer hover:scale-105 transition-all duration-500"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stylesGradient[project.state]} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}/>
              <div className="relative z-10 p-4 sm:p-6">
                <div className="space-y-4">

                  {/* ---------- Name and description ---------- */}
                  <div className="flex justify-between">
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold">{project.name}</h3>
                        {project.description && (
                      <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    </div>
                    
                    <StatusBadge key={project.id} state={project.state}/>
                  </div>

                  <ParticipantsDetails
                    confirmedParticipants={project.participants}
                    pendingParticipants={project.pendingParticipants}
                  />

                  {/* ---------- Documents ---------- */}
                  {project.documents && project.documents.length > 0 && (
                    <div className="space-y-2 pt-2">
                      {/* Encabezado documentos */}
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Documents</span>
                      </div>

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
                              className="w-full flex items-center justify-between p-3 rounded-lg border border-muted/20 bg-muted/5 hover:bg-muted/10 transition-colors cursor-pointer"
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

                  {/* ---------- Actions by state ---------- */}
                  <div className="pt-2">
                    {project.state === "UNDER_REVIEW" && (
                      <div className="grid md:grid-cols-3 gap-2 mb-2">
                        <RejectProjectModal projectId={project.id} />
                        <RequestProjectModal projectId={project.id}/>
                        <ApproveProjectModal projectId={project.id} />
                      </div>
                    )}
                      <div className="flex justify-center items-center">
                        <ViewDetails project={project}/>
                      </div>
                  </div>

                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <div className="hidden md:flex">
        <DataTable
          data={projects ? projects : []}
            columns={columns}
        />
        {selectedId && (
          <>
            <ApproveProjectModal
              projectId={selectedId}
              isOpenTable={action === "approve"}
              onOpenChangeTable={(open) => {
                if (!open) setAction(null);
              }}
            />

            <RejectProjectModal
              projectId={selectedId}
              isOpenTable={action === "reject"}
              onOpenChangeTable={(open) => {
                if (!open) setAction(null);
              }}
            />

            <RequestProjectModal
              projectId={selectedId}
              isOpenTable={action === "request"}
              onOpenChangeTable={(open) => {
                if (!open) setAction(null);
              }}
            />
          </>
        )}
      </div>

      {/* ======================== PAGINATION ======================== */}
      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination
            total={meta.totalPages}
            page={page}
            onChange={handlePageChange}
            showControls
          />
        </div>
      )}
    </div>
  );
};