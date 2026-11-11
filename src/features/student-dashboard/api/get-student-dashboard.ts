import {
  useQuery,
  useMutation,
  useQueryClient,
  queryOptions,
} from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useUser } from '@/lib/auth';
import { useNotifications } from '@/components/ui/notifications';
import {
  DiplomaCertificate,
  StudentDashboardData,
  StudentEvaluation,
  StudentGeneralDashboardResponse,
  StudentProjectDetailResponse,
  StudentProjectInfo,
  StudentProjectResultsResponse,
  UpdateStudentProjectPayload,
} from '../types';

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
    const response = await api.get<
      WrappedOrDirect<StudentProjectDetailResponse>
    >(`/events/${encodeURIComponent(String(eventId))}/my-project`, {
      suppressErrorNotification: true,
    });
    return unwrapResponse(response);
  } catch {
    return null;
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
  } catch {
    return null;
  }
};

/**
 * Endpoint 4: Modificación de Propuesta por Ajustes Solicitados
 * PATCH /api/v1/projects/:projectId
 */
export const updateStudentProject = async ({
  projectId,
  data,
}: {
  projectId: string | number;
  data: UpdateStudentProjectPayload;
}): Promise<StudentProjectInfo> => {
  const response = await api.patch<WrappedOrDirect<StudentProjectInfo>>(
    `/projects/${encodeURIComponent(String(projectId))}`,
    data,
  );
  return unwrapResponse(response);
};

/**
 * Endpoint 5: Descarga de Certificados Oficiales
 * GET /api/v1/certificates/:certificateId/download
 */
export const getCertificateDownloadUrl = (
  certificateId: string | number,
): string => {
  return `/api/certificates/${encodeURIComponent(String(certificateId))}/download`;
};

export const downloadStudentCertificate = async (
  certificateId: string | number,
): Promise<{ downloadUrl?: string; blob?: Blob }> => {
  const response = await api.get<any>(
    `/certificates/${encodeURIComponent(String(certificateId))}/download`,
  );
  return unwrapResponse(response);
};

const normalizeGeneralDashboardToStudentData = (
  general: StudentGeneralDashboardResponse,
  projectDetail?: StudentProjectInfo | null,
  resultsDetail?: StudentEvaluation | null,
): StudentDashboardData => {
  const trajectory = Array.isArray(general.trajectory) ? general.trajectory : [];

  const normalizedTrajectory = trajectory.map((item) => ({
    ...item,
    certificates: (item.certificates ?? []).map((cert) => ({
      ...cert,
      eventName: cert.eventName || item.eventName,
      semester: cert.semester || item.semester,
      downloadUrl: cert.downloadUrl || getCertificateDownloadUrl(cert.id),
    })),
  }));

  const flattenedCertificates: DiplomaCertificate[] =
    Array.isArray(general.certificates) && general.certificates.length > 0
      ? general.certificates.map((cert) => ({
          ...cert,
          downloadUrl: cert.downloadUrl || getCertificateDownloadUrl(cert.id),
        }))
      : normalizedTrajectory.flatMap((item) => item.certificates ?? []);

  const currentProjectSummary = general.currentProject;

  const resolvedProject: StudentProjectInfo | null = projectDetail
    ? {
        ...projectDetail,
        participants: projectDetail.participants ?? [],
        documents: projectDetail.documents ?? [],
        participantsCount:
          projectDetail.participantsCount ??
          projectDetail.participants?.length ??
          0,
        documentsCount:
          projectDetail.documentsCount ?? projectDetail.documents?.length ?? 0,
      }
    : currentProjectSummary
      ? {
          ...currentProjectSummary,
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

  const resolvedEvaluation: StudentEvaluation | null =
    resultsDetail !== undefined
      ? resultsDetail
      : general.evaluation
        ? {
            resultsPublished: Boolean(general.evaluation.resultsPublished),
            finalScore: general.evaluation.finalScore,
            maxScore: general.evaluation.maxScore ?? 5.0,
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
    certificates: flattenedCertificates,
  };
};

/**
 * Orquestador de consulta del Dashboard del Estudiante:
 * - Sin `eventId` (Vista general `/app`): consume `GET /students/me/dashboard` (Endpoint 1).
 * - Con `eventId` (Vista de evento `/app/events/:eventId/dashboard`): consume en paralelo
 *   `GET /students/me/dashboard` (Endpoint 1), `GET /events/:eventId/my-project` (Endpoint 2)
 *   y `GET /events/:eventId/my-project/results` (Endpoint 3).
 */
export const getStudentDashboardData = async (
  _userEmail?: string,
  eventId?: number | string,
): Promise<StudentDashboardData> => {
  const general = await getStudentGeneralDashboard();

  // Si no se solicita un evento específico, retornamos la vista consolidada general (/app)
  if (eventId === undefined || eventId === null || String(eventId) === '') {
    return normalizeGeneralDashboardToStudentData(general);
  }

  const targetEventId =
    String(eventId) === 'current'
      ? (general.currentProject?.eventId ?? 3)
      : eventId;

  const [projectDetail, resultsDetail] = await Promise.all([
    getStudentProjectByEvent(targetEventId),
    getStudentProjectResults(targetEventId),
  ]);

  return normalizeGeneralDashboardToStudentData(
    general,
    projectDetail,
    resultsDetail,
  );
};

export const getStudentDashboardQueryOptions = (
  userEmail?: string,
  eventId?: number | string,
) => {
  return queryOptions({
    queryKey: [
      'student-dashboard',
      userEmail || 'me',
      eventId !== undefined ? String(eventId) : 'general',
    ],
    queryFn: () => getStudentDashboardData(userEmail, eventId),
  });
};

export const useStudentDashboard = (eventId?: number | string) => {
  const { data: user, isLoading: isUserLoading } = useUser();
  const query = useQuery(
    getStudentDashboardQueryOptions(user?.email, eventId),
  );

  return {
    ...query,
    isLoading: isUserLoading || query.isLoading,
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
        queryKey: ['student-dashboard'],
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
