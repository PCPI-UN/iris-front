"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ProjectParticipant } from "@/types/api";

type ParticipantsDetailsProps = {
  confirmedParticipants: ProjectParticipant[];
  pendingParticipants?: ProjectParticipant[];
  title?: string;
  className?: string;
  defaultExpanded?: boolean;
};

type ParticipantRow = ProjectParticipant & {
  status: "CONFIRMED" | "PENDING";
  displayName: string;
  displaySemester: string;
  displayCareer: string;
  displayEmail: string;
  keyId: string;
};

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

export const ParticipantsDetails = ({
  confirmedParticipants,
  pendingParticipants = [],
  title = "Equipo",
  className = "",
  defaultExpanded = false,
}: ParticipantsDetailsProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const participants = useMemo<ParticipantRow[]>(() => {
    // Helper function to validate and map participants
    const mapParticipants = (items: ProjectParticipant[], status: "CONFIRMED" | "PENDING") =>
      items
        .filter((p) => {
          // Filter out invalid participants
          return p && String(p.firstName ?? "").trim() && String(p.lastName ?? "").trim();
        })
        .map((participant, index) => {
          const firstName = String(participant.firstName ?? "").trim();
          const lastName = String(participant.lastName ?? "").trim();
          const displayName = `${firstName} ${lastName}`.trim();

          return {
            ...participant,
            status,
            displayName: displayName || "N/A",
            displaySemester: participant.semester || "—",
            displayCareer: participant.career || "—",
            displayEmail: participant.email || "—",
            keyId: participant.studentCode || participant.email || `${displayName}-${index}`,
          };
        });

    const confirmed = mapParticipants(confirmedParticipants, "CONFIRMED");
    const pending = mapParticipants(pendingParticipants, "PENDING");

    return [...pending, ...confirmed];
  }, [confirmedParticipants, pendingParticipants]);

  if (participants.length === 0) {
    return (
      <section className={`space-y-3 ${className}`.trim()}>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md sm:px-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/60">{title}</p>
            <h3 className="text-sm font-semibold text-white">0 participantes</h3>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`space-y-3 ${className}`.trim()}>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md sm:px-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">{title}</p>
          <h3 className="text-sm font-semibold text-white">
            {participants.length} participante{participants.length === 1 ? "" : "s"}
          </h3>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded((value) => !value)}
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-white/15"
          aria-expanded={isExpanded}
        >
          {isExpanded ? "Colapsar" : "Expandir"}
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {isExpanded ? (
        <div className="space-y-4">
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-white/10 bg-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-white/60 border-b border-white/10">
                  <th className="px-4 py-3 min-w-fit">Full Name</th>
                  <th className="px-4 py-3 min-w-fit">Semester</th>
                  <th className="px-4 py-3 min-w-fit">Career</th>
                  <th className="px-4 py-3 min-w-fit">Email</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((participant, index) => (
                  <tr key={participant.keyId} className={index !== participants.length - 1 ? "border-b border-white/10" : ""}>
                    <td className="px-4 py-3 align-top">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-sm font-semibold text-cyan-300 ring-1 ring-cyan-400/20">
                          {getInitials(participant.displayName)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-white whitespace-nowrap">{participant.displayName}</p>
                            {participant.status === "PENDING" && (
                              <span className="inline-flex items-center rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300 shrink-0">
                                PENDING
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-sm text-white/70 whitespace-nowrap">{participant.displaySemester}</td>
                    <td className="px-4 py-3 align-top text-sm text-white/70 whitespace-nowrap">{participant.displayCareer}</td>
                    <td className="px-4 py-3 align-top text-sm text-white/70 truncate" title={participant.displayEmail}>{participant.displayEmail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {participants.map((participant) => (
              <article
                key={participant.keyId}
                className="rounded-2xl border border-white/10 bg-white/5 p-3 shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-md sm:p-4"
              >
                <div className="space-y-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-xs font-semibold text-cyan-300 ring-1 ring-cyan-400/20">
                      {getInitials(participant.displayName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 flex-wrap items-start gap-2">
                        <p className="min-w-0 flex-1 text-sm font-medium leading-tight text-white break-words">
                          {participant.displayName}
                        </p>
                        {participant.status === "PENDING" && (
                          <span className="inline-flex shrink-0 items-center rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">
                            PENDING
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <p
                    className="max-w-full overflow-x-auto rounded-lg border border-white/10 bg-black/10 px-2.5 py-2 text-xs leading-snug text-white/70 whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    title={participant.displayEmail}
                  >
                    {participant.displayEmail}
                  </p>

                  <div className="grid grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] gap-2 text-sm">
                    <div className="min-w-0 space-y-1 rounded-lg bg-white/[0.03] p-2">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-white/60">Semester</p>
                      <p className="text-xs font-medium text-white break-words">{participant.displaySemester}</p>
                    </div>
                    <div className="min-w-0 space-y-1 rounded-lg bg-white/[0.03] p-2">
                      <p className="text-[10px] uppercase tracking-[0.16em] text-white/60">Career</p>
                      <p className="text-xs font-medium text-white break-words">{participant.displayCareer}</p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
};
