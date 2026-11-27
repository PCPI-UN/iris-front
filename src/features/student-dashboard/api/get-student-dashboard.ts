import { useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError, api } from '@/lib/api-client';
import { useUser } from '@/lib/auth';
import { useNotifications } from '@/components/ui/notifications';
import { saveFile } from '@/features/reports/api/download-evaluation-report';
import {
  AcademicParticipation,
  StudentDashboardData,
  StudentEvaluation,
  StudentGeneralDashboardResponse,
  StudentProjectDetailResponse,
  StudentProjectInfo,
  StudentProjectResultsResponse,
  UpdateStudentProjectPayload,
} from '../types';
import { adaptStudentProject } from '../utils/adapt-student-project';

type WrappedOrDirect<T> = { data: T } | T;

const unwrapResponse = <T>(response: WrappedOrDirect<T>): T => {
  if (
    response &&
    typeof response === 'object' &&
    'data' in response &&
    (response as { data?: T }).data !== undefined
  ) {
    return (response as { data: T }).data;
  }
  return response as T;
};

// 404: el usuario no tiene proyecto en el evento. Cualquier otro fallo se propaga
// para que la vista muestre el error en vez de un estado vacío engañoso.
const isNotFound = (error: unknown): boolean =>
  error instanceof ApiError && error.status === 404;

/**
 * Endpoint 1: Dashboard General del Estudiante
 * GET /api/v1/students/me/dashboard
 */
export const getStudentGeneralDashboard =
  async (): Promise<StudentGeneralDashboardResponse> => {
    const response = await api.get<
      WrappedOrDirect<StudentGeneralDashboardResponse>
    >('/students/me/dashboard');
    return unwrapResponse(response);
  };

/**
 * Endpoint 2: Ficha Técnica del Proyecto en un Evento
 * GET /api/v1/events/:eventId/my-project
 */
export const getStudentProjectByEvent = async (
  eventId: number | string,
): Promise<StudentProjectDetailResponse | null> => {
  try {
    // El gateway responde { project, event }; se adapta a la forma del dashboard
    const response = await api.get<WrappedOrDirect<unknown>>(
      `/events/${encodeURIComponent(String(eventId))}/my-project`,
      { suppressErrorNotification: true },
    );
    return adaptStudentProject(unwrapResponse(response));
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
};

/**
 * Endpoint 3: Resultados Oficiales y Rúbrica Consolidada
 * GET /api/v1/events/:eventId/my-project/results
 */
export const getStudentProjectResults = async (
  eventId: number | string,
): Promise<StudentProjectResultsResponse | null> => {
  try {
    const response = await api.get<
      WrappedOrDirect<StudentProjectResultsResponse>
    >(`/events/${encodeURIComponent(String(eventId))}/my-project/results`, {
      suppressErrorNotification: true,
    });
    return unwrapResponse(response);
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
};

/**
 * Endpoint 4: Modificación de Propuesta por Ajustes Solicitados
 * PATCH /projects/:projectId/info guarda nombre y descripción;
 * POST /projects/:projectId/change-to-under-review la reenvía a revisión.
 * Ninguno de los dos devuelve el proyecto: los datos se vuelven a consultar.
 */
export const updateStudentProject = async ({
  projectId,
  data,
}: {
  projectId: string | number;
  data: UpdateStudentProjectPayload;
}): Promise<void> => {
  const id = encodeURIComponent(String(projectId));
  await api.patch(`/projects/${id}/info`, data);
  await api.post(`/projects/${id}/change-to-under-review`);
};

/**
 * Endpoint 5: Diploma de premio del proyecto en un evento (PDF)
 * GET /api/v1/events/:eventId/my-project/diploma
 * Solo existe cuando la trayectoria trae `diplomaAvailable: true`.
 */
export const getMyDiploma = (eventId: number | string) =>
  api.download(
    `/events/${encodeURIComponent(String(eventId))}/my-project/diploma`,
    {
      headers: { Accept: 'application/pdf' },
      // El botón muestra su propio mensaje de error
      suppressErrorNotification: true,
    },
  );

/** Nombre del archivo cuando el backend no envía Content-Disposition */
export const getDiplomaFallbackName = (eventId: number | string) =>
  `diploma_evento_${eventId}.pdf`;

export const downloadMyDiploma = async (eventId: number | string) => {
  const { blob, fileName } = await getMyDiploma(eventId);
  saveFile(blob, fileName ?? getDiplomaFallbackName(eventId));
};

/**
 * Mensaje para el estudiante cuando falla la descarga del diploma. En 403 (resultados
 * sin publicar) y 404 (sin proyecto, sin premio o evento sin diseño) el backend ya
 * explica el motivo en español.
 */
export const getDiplomaErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 403:
        return (
          error.message || 'Los resultados del evento aún no se han publicado.'
        );
      case 404:
        return error.message || 'Este proyecto no tiene diploma en el evento.';
    }
  }
  return 'No se pudo descargar el diploma. Intenta de nuevo.';
};

/**
 * Si el evento tiene diploma descargable según la trayectoria del dashboard
 * (`diplomaAvailable`, que el backend calcula con la misma regla que la descarga).
 */
export const isDiplomaAvailableForEvent = (
  trajectory: AcademicParticipation[] | undefined,
  eventId: number | string | null | undefined,
): boolean =>
  eventId != null &&
  (trajectory ?? []).some(
    (item) =>
      item.diplomaAvailable === true && String(item.eventId) === String(eventId),
  );

/**
 * Combina el dashboard general con la ficha y los resultados de un evento.
 * - `projectDetail` / `resultsDetail` sin definir: vista general, se usa el resumen del dashboard.
 * - `null`: se pidió un evento y el usuario no tiene proyecto (o resultados) en él; no se
 *   sustituye por el proyecto de otro evento.
 */
const normalizeGeneralDashboardToStudentData = (
  general: StudentGeneralDashboardResponse,
  projectDetail?: StudentProjectInfo | null,
  resultsDetail?: StudentEvaluation | null,
): StudentDashboardData => {
  const trajectory = Array.isArray(general.trajectory) ? general.trajectory : [];

  const normalizedTrajectory = trajectory.map((item) => ({
    ...item,
    diplomaAvailable: Boolean(item.diplomaAvailable),
  }));

  const currentProjectSummary = general.currentProject;
  const sameEvent = (a?: string | number | null, b?: string | number | null) =>
    a !== undefined && a !== null && b !== undefined && b !== null
      ? String(a) === String(b)
      : false;

  // La ficha del evento no trae categoría ni semestre: se completan con el dashboard general
  const detailIsCurrentProject = projectDetail
    ? sameEvent(currentProjectSummary?.eventId, projectDetail.eventId)
    : false;
  const detailTrajectoryItem = projectDetail
    ? normalizedTrajectory.find((item) =>
        sameEvent(item.eventId, projectDetail.eventId),
      )
    : undefined;

  const resolvedProject: StudentProjectInfo | null = projectDetail
    ? {
        ...projectDetail,
        categoryName:
          projectDetail.categoryName ??
          (detailIsCurrentProject
            ? currentProjectSummary?.categoryName
            : null) ??
          detailTrajectoryItem?.courseName ??
          null,
        semester:
          projectDetail.semester ??
          (detailIsCurrentProject
            ? currentProjectSummary?.semester
            : undefined) ??
          detailTrajectoryItem?.semester,
        isCurrent: projectDetail.isCurrent ?? detailIsCurrentProject,
        participants: projectDetail.participants ?? [],
        documents: projectDetail.documents ?? [],
        participantsCount:
          projectDetail.participantsCount ??
          projectDetail.participants?.length ??
          0,
        documentsCount:
          projectDetail.documentsCount ?? projectDetail.documents?.length ?? 0,
      }
    : currentProjectSummary && projectDetail === undefined
      ? {
          ...currentProjectSummary,
          isCurrent: true,
          documents: currentProjectSummary.documents ?? [],
          participants: currentProjectSummary.participants ?? [],
          participantsCount:
            currentProjectSummary.participantsCount ??
            currentProjectSummary.participants?.length ??
            1,
          documentsCount:
            currentProjectSummary.documentsCount ??
            currentProjectSummary.documents?.length ??
            0,
        }
      : null;

  // La escala (maxScore) la define cada evento: nunca se asume un valor por defecto
  const resolvedEvaluation: StudentEvaluation | null =
    resultsDetail !== undefined
      ? resultsDetail
      : general.evaluation
        ? {
            resultsPublished: Boolean(general.evaluation.resultsPublished),
            finalScore: general.evaluation.finalScore,
            maxScore: general.evaluation.maxScore,
            ranking: general.evaluation.ranking,
            criteriaScores: general.evaluation.criteriaScores,
            consolidatedFeedback: general.evaluation.consolidatedFeedback,
          }
        : null;

  return {
    profile: general.profile,
    kpis: general.kpis,
    currentProject: resolvedProject,
    evaluation: resolvedEvaluation,
    trajectory: normalizedTrajectory,
  };
};

const studentDashboardKeys = {
  all: ['student-dashboard'] as const,
  general: (userKey: string) =>
    [...studentDashboardKeys.all, userKey, 'general'] as const,
  eventProject: (userKey: string, eventId: string) =>
    [...studentDashboardKeys.all, userKey, 'event', eventId, 'project'] as const,
  eventResults: (userKey: string, eventId: string) =>
    [...studentDashboardKeys.all, userKey, 'event', eventId, 'results'] as const,
};

/**
 * Datos del Dashboard del Estudiante:
 * - Sin `eventId` (vista general `/app`): `GET /students/me/dashboard`.
 * - Con `eventId` (vista de evento `/app/events/:eventId/dashboard`): además
 *   `GET /events/:eventId/my-project` y `GET /events/:eventId/my-project/results`.
 *   `'current'` resuelve el evento del proyecto actual del dashboard general.
 *
 * Cada endpoint es una consulta propia: el dashboard general se comparte en caché entre
 * las dos vistas y ninguna consulta se lanza hasta conocer el usuario de la sesión.
 */
export const useStudentDashboard = (eventId?: number | string) => {
  const { data: user, isLoading: isUserLoading } = useUser();
  const enabled = !isUserLoading;
  const userKey = user?.email || 'me';

  const generalQuery = useQuery({
    queryKey: studentDashboardKeys.general(userKey),
    queryFn: getStudentGeneralDashboard,
    enabled,
  });

  const wantsEvent =
    eventId !== undefined && eventId !== null && String(eventId) !== '';
  const targetEventId = !wantsEvent
    ? undefined
    : String(eventId) === 'current'
      ? generalQuery.data?.currentProject?.eventId
      : eventId;
  const hasTargetEvent = targetEventId !== undefined && targetEventId !== null;
  const eventKey = hasTargetEvent ? String(targetEventId) : 'none';
  const eventEnabled = enabled && hasTargetEvent;

  const projectQuery = useQuery({
    queryKey: studentDashboardKeys.eventProject(userKey, eventKey),
    queryFn: () => getStudentProjectByEvent(eventKey),
    enabled: eventEnabled,
  });

  const resultsQuery = useQuery({
    queryKey: studentDashboardKeys.eventResults(userKey, eventKey),
    queryFn: () => getStudentProjectResults(eventKey),
    enabled: eventEnabled,
  });

  const general = generalQuery.data;
  const projectDetail = projectQuery.data;
  const resultsDetail = resultsQuery.data;

  const data = useMemo<StudentDashboardData | undefined>(() => {
    if (!general) return undefined;
    if (!wantsEvent) return normalizeGeneralDashboardToStudentData(general);
    // 'current' sin proyecto en un evento vigente: no hay ficha que consultar
    if (!hasTargetEvent) {
      return normalizeGeneralDashboardToStudentData(general, null, null);
    }
    // undefined = aún cargando; null = el usuario no tiene proyecto en el evento
    if (projectDetail === undefined || resultsDetail === undefined) {
      return undefined;
    }
    return normalizeGeneralDashboardToStudentData(
      general,
      projectDetail,
      resultsDetail,
    );
  }, [general, projectDetail, resultsDetail, wantsEvent, hasTargetEvent]);

  const refetchGeneral = generalQuery.refetch;
  const refetchProject = projectQuery.refetch;
  const refetchResults = resultsQuery.refetch;
  const refetch = useCallback(async () => {
    await Promise.all([
      refetchGeneral(),
      ...(eventEnabled ? [refetchProject(), refetchResults()] : []),
    ]);
  }, [eventEnabled, refetchGeneral, refetchProject, refetchResults]);

  const eventQueries = eventEnabled ? [projectQuery, resultsQuery] : [];
  const queries = [generalQuery, ...eventQueries];

  return {
    data,
    isLoading: isUserLoading || queries.some((query) => query.isLoading),
    isFetching: queries.some((query) => query.isFetching),
    isError: queries.some((query) => query.isError),
    refetch,
  };
};

export const useUpdateStudentProject = ({
  eventId,
}: {
  eventId?: number | string;
} = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateStudentProject,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: studentDashboardKeys.all,
      });
      if (eventId !== undefined) {
        queryClient.invalidateQueries({
          queryKey: ['my-project', String(eventId)],
        });
      }
      useNotifications.getState().addNotification({
        type: 'success',
        title: 'Propuesta actualizada',
        message:
          'Los ajustes del proyecto se han guardado y enviado nuevamente a revisión del comité.',
      });
    },
  });
};
