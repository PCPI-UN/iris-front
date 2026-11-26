"use client";

import { GraduationCap } from "lucide-react";

import { useTerms } from "../api/get-terms";
import { eventTermLabel } from "../utils/term-label";

type EventTermLabelProps = {
  termId: number | null | undefined;
};

/** Academic term of an event (202610), or "Sin periodo" for an event created before terms existed */
export function EventTermLabel({ termId }: EventTermLabelProps) {
  const termsQuery = useTerms();
  const label = eventTermLabel(termId, termsQuery.data);

  return (
    <div className="flex items-center gap-2">
      <GraduationCap className="h-4 w-4 text-default-400" />
      <span className="text-default-400">Periodo académico:</span>
      <span>{label}</span>
    </div>
  );
}
