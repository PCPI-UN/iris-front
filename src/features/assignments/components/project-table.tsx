"use client";

import { DataTable } from "@/components/data-table";
import { columnsProject } from "./columns-project-table";
import { useSearchParams, useRouter } from "next/navigation";
import { Pagination } from "@heroui/pagination";
import { ProjectWithJurors, useProjectsWithJurors } from "@/features/projects/api/get-projects-with-jurors";
import { useState } from "react";
import { SearchProjects } from "@/components/search-project/search_projects";
import { Spinner } from "@heroui/spinner";

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
  const categoryId = searchParams?.get("categoryId") ? Number(searchParams.get("categoryId")) : 0;

  const projectsQuery = useProjectsWithJurors({ currentPage:page, eventId, state, categoryId });
  const meta = projectsQuery.data?.meta;

  const [filterValue, setFilterValue] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const defaultProjects = projectsQuery.data?.data ?? [];
  
  const projects: ProjectWithJurors[] = filterValue
    ? searchResults
    : defaultProjects;
  
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    params.set("page", String(newPage));
    if (eventId) params.set("event", String(eventId));
    if (state) params.set("state", state);
    if (categoryId) params.set("categoryId", String(categoryId));
    router.push(`?${params.toString()}`);
  };
  
  const columns = columnsProject({onSelectProject, onViewProject});

  return (
    <div className="justify-between mr-5">
      <div className="mb-8">
        <SearchProjects
          eventId={eventId}
          state={state}
          categoryId={categoryId}
          setSearchResults={setSearchResults}
          setIsSearching={setIsSearching}
          setFilterValue={setFilterValue}
          filterValue={filterValue}
        />
      </div>
      {isSearching ? (
        <Spinner className="flex justify-center"/>
      ) : (
        <DataTable data={projects ? projects : []} columns={columns} styles={"max-h-[70vh]"}/>
      )}
      
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