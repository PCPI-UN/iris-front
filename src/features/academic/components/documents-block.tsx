import { ExternalLink, FileText } from "lucide-react";

import { AcademicPanel } from "./academic-panel";

import { AcademicDocument } from "@/features/academic/types";
import {
  DOCUMENT_TYPE_LABELS,
  normalizeDocumentType,
} from "@/features/projects/api/admin-project-documents";
import { documentLink } from "@/lib/document-link";

/** Active documents of a project (logo, poster, supporting document), each opening in a new tab */
export const DocumentsBlock = ({
  documents,
}: {
  documents: AcademicDocument[];
}) => (
  <AcademicPanel title="Documentos">
    {documents.length === 0 ? (
      <p className="text-sm text-slate-400">Sin documentos cargados.</p>
    ) : (
      <ul className="flex flex-col gap-2">
        {documents.map((document) => {
          const type = normalizeDocumentType(document.type);

          return (
            <li key={document.id}>
              <a
                className="flex min-h-[44px] items-center justify-between gap-3 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200 transition-colors hover:bg-cyan-400/10"
                href={documentLink(document)}
                rel="noopener noreferrer"
                target="_blank"
              >
                <span className="flex items-center gap-2">
                  <FileText
                    aria-hidden="true"
                    className="size-4 shrink-0 text-cyan-400"
                  />
                  {type ? DOCUMENT_TYPE_LABELS[type] : String(document.type)}
                </span>
                <ExternalLink
                  aria-hidden="true"
                  className="size-4 shrink-0 text-slate-500"
                />
              </a>
            </li>
          );
        })}
      </ul>
    )}
  </AcademicPanel>
);
