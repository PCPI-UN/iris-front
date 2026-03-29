// Transform database data into the format expected 

type ProjectDTO = {
  id: string;
  name: string;
  description?: string;
  logo: string;
  state: string;
  eventId: string;
  eventNumber?: string;
  createdAt: number;
  documents: Array<{ type: string; url: string }>;
  participants: Array<{
    firstName: string;
    lastName: string;
    email: string;
    studentCode?: string;
  }>;
};

type ProjectRecord = {
  id: string;
  name: string;
  description?: string;
  logo: string;
  state: string;
  eventId: string;
  eventNumber?: string;
  createdAt: number;
  documents?: unknown[];
  participants?: unknown[];
};

const normalizeDocuments = (documents: unknown[]): ProjectDTO["documents"] => {
  return documents
    .filter(
      (document): document is { type: string; url: string } =>
        typeof document === "object" &&
        document !== null &&
        "type" in document &&
        "url" in document,
    )
    .map((document) => ({
      type: String(document.type),
      url: String(document.url),
    }));
};

const normalizeParticipants = (
  participants: unknown[],
): ProjectDTO["participants"] => {
  return participants
    .filter(
      (
        participant,
      ): participant is {
        firstName: string;
        lastName: string;
        email: string;
        studentCode?: string;
      } =>
        typeof participant === "object" &&
        participant !== null &&
        "firstName" in participant &&
        "lastName" in participant &&
        "email" in participant,
    )
    .map((participant) => ({
      firstName: String(participant.firstName),
      lastName: String(participant.lastName),
      email: String(participant.email),
      studentCode:
        participant.studentCode !== undefined
          ? String(participant.studentCode)
          : undefined,
    }));
};

export const mapProjectToDTO = (project: ProjectRecord): ProjectDTO => {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    logo: project.logo,
    state: project.state,
    eventId: project.eventId,
    eventNumber: project.eventNumber || "",
    createdAt: project.createdAt,
    documents: normalizeDocuments(project.documents ?? []),
    participants: normalizeParticipants(project.participants ?? []),
  };
};
