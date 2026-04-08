import { Button } from "@heroui/button";
import { Edit2, ExternalLink, FileText } from "lucide-react";
import { ProjectDocument } from "@/types/api";
import { StudentDashboardSectionCard } from "./student-dashboard-section-card";

type StudentDashboardDocumentsSectionProps = {
  primaryDocument?: ProjectDocument;
  canEdit: boolean;
  onEdit: () => void;
};

export const StudentDashboardDocumentsSection = ({
  primaryDocument,
  canEdit,
  onEdit,
}: StudentDashboardDocumentsSectionProps) => {
  return (
    <StudentDashboardSectionCard
      title="Documentos del proyecto"
      icon={FileText}
      ariaLabel="Documentacion del proyecto"
      className="space-y-4"
      action={
        canEdit ? (
          <Button
            size="sm"
            variant="flat"
            className="gap-1"
            onClick={onEdit}
            aria-label="Editar documentos del proyecto"
          >
            <Edit2 className="h-3 w-3" />
            Editar docs
          </Button>
        ) : null
      }
    >
      {primaryDocument ? (
        <a
          href={primaryDocument.url}
          target="_blank"
          rel="noreferrer"
          aria-label={`Ver poster del proyecto: ${primaryDocument.type || "Poster"} (abre en nueva pestaña)`}
          className="group flex w-full items-center justify-between gap-3 rounded-xl border border-default-200 bg-default-50/50 px-4 py-4 transition-colors hover:border-primary/50 hover:bg-primary/5"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="rounded-lg bg-primary/10 p-2 text-primary transition-transform group-hover:scale-105"
              aria-hidden="true"
            >
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-default-500">
                Poster del proyecto
              </p>
              <p className="truncate text-base font-semibold">
                {primaryDocument.type || "Poster"}
              </p>
            </div>
          </div>
          <div
            className="rounded-lg bg-default-100 p-2 transition-colors group-hover:bg-primary/15"
            aria-hidden="true"
          >
            <ExternalLink className="h-4 w-4" />
          </div>
        </a>
      ) : (
        <p className="rounded-xl border border-default-200 bg-background p-4 text-sm text-default-500">
          No hay poster registrado.
        </p>
      )}
    </StudentDashboardSectionCard>
  );
};
