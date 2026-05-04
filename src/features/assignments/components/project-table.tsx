"use client";

import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { columnsProject } from "./columns-project-table";
import { useSearchParams, useRouter } from "next/navigation";
import { useProjects } from "@/features/projects/api/get-projects";
import { Pagination } from "@heroui/pagination";

export const ProjectsTable = ({
  onSelectProject,
  onViewProject,
}: {
  onSelectProject: (project: any) => void;
  onViewProject: (project: any) => void;
}) => {

  const searchParams = useSearchParams();
  const router = useRouter();
  
  const page = searchParams?.get("page") ? Number(searchParams.get("page")) : 1;
  const eventId = searchParams?.get("event") ? Number(searchParams.get("event")) : 0;
  const state = "APPROVED";
  const courseId = searchParams?.get("courseId") ? Number(searchParams.get("courseId")) : 0;

  const projectsQuery = useProjects({ page, eventId, state, courseId });
  const projects = projectsQuery.data?.data;
  const meta = projectsQuery.data?.meta;
  
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    params.set("page", String(newPage));
    if (eventId) params.set("event", String(eventId));
    if (state) params.set("state", state);
    router.push(`?${params.toString()}`);
  };
  

  const columns = columnsProject({onSelectProject, onViewProject})

  return (
    <div className="flex justify-between mr-5">
      <DataTable data={projects ? projects : []} columns={columns} />
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