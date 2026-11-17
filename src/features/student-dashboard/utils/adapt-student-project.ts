import {
  EnrollmentStatus,
  StudentProjectDocument,
  StudentProjectInfo,
  StudentProjectParticipant,
} from '../types';

/**
 * Adapta la respuesta de `GET /events/:eventId/my-project` a `StudentProjectInfo`.
 *
 * El gateway responde `{ project, event }` con el proyecto tal como lo entrega
 * project-service (`state`, `courseId`, participantes con `ParticipantCode` y `status`
 * numérico, documentos sin título). La categoría y el semestre no vienen en esta
 * respuesta: se completan después con los datos de `GET /students/me/dashboard`.
 */

type RawRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is RawRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const ENROLLMENT_STATUSES: EnrollmentStatus[] = [
  'PENDING',
  'UNDER_REVIEW',
  'APPROVED',
  'REQUEST_CHANGES',
  'REJECTED',
];

// Códigos del enum ProjectState del backend, por si llega como número
const ENROLLMENT_STATUS_BY_CODE: Record<string, EnrollmentStatus> = {
  '1': 'UNDER_REVIEW',
  '2': 'APPROVED',
  '3': 'REJECTED',
  '4': 'REQUEST_CHANGES',
};

const toEnrollmentStatus = (raw: unknown): EnrollmentStatus => {
  const value = String(raw ?? '').trim();
  if ((ENROLLMENT_STATUSES as string[]).includes(value)) {
    return value as EnrollmentStatus;
  }
  return ENROLLMENT_STATUS_BY_CODE[value] ?? 'UNDER_REVIEW';
};

// Enum PendingParticipantStatus: 1 PENDING, 2 INVITED, 3 JOINED
const toParticipantStatus = (
  raw: unknown,
): StudentProjectParticipant['status'] => {
  const value = String(raw ?? '')
    .trim()
    .toUpperCase();
  if (value === '3' || value === 'JOINED') return 'joined';
  if (value === '2' || value === 'INVITED' || value === 'INVITADO') {
    return 'Invitado';
  }
  return 'Pendiente';
};

// Enum TypedDocument: 1 LOGO, 2 POSTER, 3 SUPPORTING_DOCUMENT
const DOCUMENT_TYPE_BY_CODE: Record<string, string> = {
  '1': 'LOGO',
  '2': 'POSTER',
  '3': 'SUPPORTING_DOCUMENT',
};

const DOCUMENT_TITLE_BY_TYPE: Record<string, string> = {
  POSTER: 'Póster del proyecto',
  LOGO: 'Logo del proyecto',
  SUPPORTING_DOCUMENT: 'Documento de soporte',
};

const toText = (value: unknown): string =>
  value === null || value === undefined ? '' : String(value);

const toNullableText = (value: unknown): string | null => {
  const text = toText(value).trim();
  return text ? text : null;
};

const toSemesterNumber = (value: unknown): number | undefined => {
  const text = toText(value).trim();
  return /^\d+$/.test(text) ? Number(text) : undefined;
};

const adaptParticipant = (
  raw: unknown,
  index: number,
): StudentProjectParticipant | null => {
  if (!isRecord(raw)) return null;
  const email = toText(raw.email);
  const role = raw.role === 'Líder' || raw.role === 'Miembro' ? raw.role : undefined;
  return {
    id: toText(raw.id) || email || `participant-${index}`,
    firstName: toText(raw.firstName),
    lastName: toText(raw.lastName),
    email,
    studentCode:
      toNullableText(raw.ParticipantCode ?? raw.studentCode) ?? undefined,
    career: toNullableText(raw.career) ?? undefined,
    semester: toSemesterNumber(raw.semester),
    role,
    status: toParticipantStatus(raw.status),
  };
};

const adaptDocument = (
  raw: unknown,
  index: number,
): StudentProjectDocument | null => {
  if (!isRecord(raw)) return null;
  const state = toText(raw.state).toUpperCase();
  // Solo los documentos activos cuentan como entregados
  if (state === 'INACTIVE' || state === '2') return null;

  const rawType = toText(raw.type);
  const type = DOCUMENT_TYPE_BY_CODE[rawType] ?? rawType;
  const createdAt =
    typeof raw.createdAt === 'number'
      ? raw.createdAt
      : Date.parse(toText(raw.createdAt)) || undefined;

  return {
    id: toText(raw.id) || `document-${index}`,
    type,
    title: toText(raw.title) || DOCUMENT_TITLE_BY_TYPE[type] || 'Documento',
    url: toText(raw.url),
    createdAt,
  };
};

const adaptList = <T>(
  raw: unknown,
  adapt: (item: unknown, index: number) => T | null,
): T[] =>
  Array.isArray(raw)
    ? raw.map(adapt).filter((item): item is T => item !== null)
    : [];

const hasEnded = (endDate: unknown): boolean | undefined => {
  const time = Date.parse(toText(endDate));
  return Number.isNaN(time) ? undefined : time < Date.now();
};

export const adaptStudentProject = (
  payload: unknown,
): StudentProjectInfo | null => {
  if (!isRecord(payload)) return null;

  // Forma real del gateway: { project, event }
  const project = isRecord(payload.project) ? payload.project : payload;
  const event = isRecord(payload.event) ? payload.event : undefined;

  if (project.id === undefined || project.id === null) return null;

  const enrollmentStatus = toEnrollmentStatus(
    project.enrollmentStatus ?? project.state,
  );
  const eventEnded = event ? hasEnded(event.endDate) : undefined;

  const canEdit =
    typeof project.canEdit === 'boolean'
      ? project.canEdit
      : // Misma regla que el backend: cambios solicitados y evento sin terminar
        enrollmentStatus === 'REQUEST_CHANGES' && eventEnded !== true;

  const isCurrent =
    typeof project.isCurrent === 'boolean'
      ? project.isCurrent
      : eventEnded === undefined
        ? undefined
        : !eventEnded;

  return {
    id: project.id as number | string,
    eventId: (project.eventId ?? event?.id ?? '') as number | string,
    eventName: toText(project.eventName ?? event?.name),
    projectCode: toNullableText(project.projectCode),
    name: toText(project.name ?? project.title),
    description: toNullableText(project.description),
    categoryName: toNullableText(project.categoryName),
    enrollmentStatus,
    canEdit,
    documents: adaptList(project.documents, adaptDocument),
    participants: adaptList(project.participants, adaptParticipant),
    semester: toNullableText(project.semester) ?? undefined,
    isCurrent,
  };
};
