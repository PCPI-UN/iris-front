export type ParticipantName = { firstName?: string; lastName?: string };

type ParticipantLike = ParticipantName & {
  userId?: number | string;
  studentCode?: string;
};

type ProjectParticipants = {
  participants?: ParticipantLike[];
  pendingParticipants?: ParticipantName[];
};

const fullName = (participant?: ParticipantName) =>
  `${participant?.firstName ?? ""} ${participant?.lastName ?? ""}`.trim();

/**
 * Enrolled participants without their name: the admin listings (with-jurors)
 * only send userId and studentCode for them.
 */
export const userIdsWithoutName = (projects: ProjectParticipants[]) => [
  ...new Set(
    projects.flatMap((project) =>
      (project.participants ?? [])
        .filter((participant) => !fullName(participant) && participant.userId)
        .map((participant) => Number(participant.userId)),
    ),
  ),
];

/**
 * Names of the participants of a project for Monitoreo: the pending ones when
 * there are, otherwise the enrolled ones, with the name looked up by userId
 * (`namesByUserId`) when the listing did not bring it. Falls back to the
 * student code while the name is loading or could not be read.
 */
export const participantLabels = (
  project: ProjectParticipants,
  namesByUserId: Map<number, ParticipantName> = new Map(),
): string[] => {
  const pendingLabels = (project.pendingParticipants ?? [])
    .map(fullName)
    .filter((label) => label.length > 0);

  if (pendingLabels.length > 0) return pendingLabels;

  return (project.participants ?? []).map((participant) => {
    const name =
      fullName(participant) ||
      fullName(namesByUserId.get(Number(participant.userId)));

    if (name) return name;
    if (participant.studentCode) return `Código ${participant.studentCode}`;

    return "Participante";
  });
};
