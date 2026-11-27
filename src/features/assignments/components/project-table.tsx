"use client";

import { Pagination } from "@heroui/pagination";
import { Spinner } from "@heroui/spinner";

import { AssignmentProjects } from "../hooks/use-assignment-projects";
import { JUROR_SEARCH_EMPTY_MESSAGE } from "../hooks/use-juror-project-search";

import { columnsProject } from "./columns-project-table";
import { JurorSearchInput } from "./juror-search-input";
import { ProjectSearchInput } from "./project-search-input";

import { DataTable } from "@/components/data-table";

export const ProjectsTable = ({
  assignment,
  onSelectProject,
  onViewProject,
}: {
  assignment: AssignmentProjects;
  onSelectProject: (project: any) => void;
  onViewProject: (project: any) => void;
}) => {
  const { jurorSearch, projects, meta, page, isLoading } = assignment;
  const columns = columnsProject({ onSelectProject, onViewProject });

  return (
    <div className="justify-between mr-5">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row">
        <ProjectSearchInput
          value={assignment.nameTerm}
          onValueChange={assignment.setNameTerm}
        />
        <JurorSearchInput
          value={jurorSearch.jurorTerm}
          onValueChange={jurorSearch.setJurorTerm}
        />
      </div>
      {isLoading ? (
        <Spinner className="flex justify-center" />
      ) : (
        <DataTable
          data={projects}
          columns={columns}
          styles={"max-h-[70vh]"}
          emptyContent={
            jurorSearch.isActive ? JUROR_SEARCH_EMPTY_MESSAGE : undefined
          }
        />
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination
            total={meta.totalPages}
            page={page}
            onChange={assignment.setPage}
            showControls
          />
        </div>
      )}
    </div>
  );
};
