import { HttpResponse, http } from 'msw';
import { env } from '@/config/env';
import { db, persistDb } from '../db';
import { requireAuth, networkDelay } from '../utils';
import {
  DiplomaCertificate,
  EnrollmentStatus,
  StudentDashboardData,
  StudentEvaluation,
  StudentProjectInfo,
} from '@/features/student-dashboard/types';
import {
  getStudentDashboardDataByEmail,
  scenarioPublishedRegular,
  studentMockScenariosByEmail,
} from '@/features/student-dashboard/testing/fixtures';

const cloneDeep = <T>(value: T): T => JSON.parse(JSON.stringify(value));

/**
 * Estado en memoria del Mock Server para soportar mutaciones (Endpoint 4: PATCH /projects/:projectId)
 * durante la sesión del servidor mock o pruebas de integración.
 */
let scenarioStoreByEmail: Record<string, StudentDashboardData> = cloneDeep(
  studentMockScenariosByEmail,
);

export const resetStudentDashboardMockState = () => {
  scenarioStoreByEmail = cloneDeep(studentMockScenariosByEmail);
};

const toPublicNumericEventId = (value: string | number): number | string => {
  const str = String(value ?? '').trim();
  const slugMatch = str.match(/^(?:event-|.*-)(\d+)$/);
  if (slugMatch) {
    return Number(slugMatch[1]);
  }
  const num = Number(str);
  return Number.isNaN(num) ? str : num;
};

const toInternalPrefixedEventId = (value: string | number): string => {
  const numeric = toPublicNumericEventId(value);
  if (typeof numeric === 'number' && Number.isFinite(numeric)) {
    return `event-${String(numeric).padStart(3, '0')}`;
  }
  return String(value);
};

/**
 * Construye dinámicamente el StudentDashboardData desde `db` (mocked-db.json)
 * para usuarios registrados en la base de datos que no pertenezcan a los 5 correos semilla.
 */
const buildStudentDashboardFromDb = (user: any): StudentDashboardData => {
  const userEmail = String(user?.email ?? '').toLowerCase();
  const userId = String(user?.id ?? '');

  // Si existe en el store semilla, retornar su estado actual (incluyendo mutaciones PATCH)
  if (userEmail && scenarioStoreByEmail[userEmail]) {
    return scenarioStoreByEmail[userEmail];
  }

  // Buscar proyectos en db.project donde participe este usuario
  const allProjects = db.project.getAll();
  const userProjects = allProjects.filter((proj: any) =>
    (proj.participants ?? []).some(
      (p: any) => String(p?.email ?? '').toLowerCase() === userEmail,
    ),
  );

  // Membresías de eventos del usuario
  const memberships =
    db.eventMembership?.findMany({
      where: { userId: { equals: userId } },
    }) ?? [];

  if (userProjects.length === 0 && memberships.length === 0) {
    // Fallback al escenario regular para cuentas genéricas de previsualización o perfil vacío
    const participantRecord = allProjects
      .flatMap((p: any) => p.participants ?? [])
      .find((p: any) => String(p?.email ?? '').toLowerCase() === userEmail);

    return {
      profile: {
        id: userId || 'usr_dynamic',
        firstName: user?.firstName || participantRecord?.firstName || 'Estudiante',
        lastName: user?.lastName || participantRecord?.lastName || 'Uninorte',
        email: userEmail || 'estudiante@iris.com',
        studentCode: participantRecord?.studentCode || '200150000',
        career:
          participantRecord?.career ||
          'Ingeniería de Sistemas y Computación',
        semester: Number(participantRecord?.semester || 8),
      },
      kpis: {
        totalFairs: 0,
        totalProjects: 0,
        totalAwards: 0,
      },
      currentProject: null,
      evaluation: null,
      trajectory: [],
      certificates: [],
    };
  }

  // Ordenar proyectos del más reciente al más antiguo
  const sortedProjects = [...userProjects].sort(
    (a: any, b: any) => Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0),
  );

  const latestProject = sortedProjects[0];
  const participantInfo: Record<string, any> =
    (latestProject?.participants ?? []).find(
      (p: any) => String(p?.email ?? '').toLowerCase() === userEmail,
    ) ?? {};

  const mapDbProjectToStudentProject = (
    proj: any,
    isHistorical: boolean = false,
  ): StudentProjectInfo => {
    const event = db.event.findFirst({
      where: { id: { equals: String(proj.eventId) } },
    });
    const course = db.course.findFirst({
      where: {
        id: { equals: String(proj.categoryId || proj.courseId || '') },
      },
    });
    const rawState = String(proj.state || 'UNDER_REVIEW').toUpperCase();
    const enrollmentStatus: EnrollmentStatus =
      rawState === 'APPROVED' ||
      rawState === 'REQUEST_CHANGES' ||
      rawState === 'REJECTED' ||
      rawState === 'PENDING' ||
      rawState === 'UNDER_REVIEW'
        ? (rawState as EnrollmentStatus)
        : 'UNDER_REVIEW';

    const eventClosed =
      isHistorical || event?.active === false || event?.status === 4;

    return {
      id: proj.id,
      eventId: toPublicNumericEventId(proj.eventId),
      eventName: event?.name || 'Feria de Proyectos Uninorte',
      semester: '2026-1',
      projectCode:
        proj.projectCode ||
        `PROY-${String(proj.eventNumber || '001').padStart(3, '0')}`,
      name: proj.name,
      description: proj.description || '',
      categoryName: course?.description || 'Ingeniería & Tecnología',
      enrollmentStatus,
      canEdit: !eventClosed && enrollmentStatus === 'REQUEST_CHANGES',
      documents: (proj.documents ?? []).map((doc: any, idx: number) => ({
        id: doc.id || `doc_${proj.id}_${idx + 1}`,
        type: doc.type || 'POSTER',
        title:
          doc.title ||
          (doc.type === 'POSTER'
            ? 'Póster de Proyecto Oficial (PDF)'
            : 'Memoria Técnica y Arquitectura'),
        url: doc.url || 'https://storage.uninorte.edu.co/docs/poster.pdf',
        createdAt: proj.createdAt,
      })),
      participants: (proj.participants ?? []).map((p: any, idx: number) => ({
        id: p.id || `part_${proj.id}_${idx + 1}`,
        firstName: p.firstName || 'Estudiante',
        lastName: p.lastName || '',
        email: p.email || '',
        studentCode: p.studentCode || p.ParticipantCode || '200100000',
        career: p.career || p.carreer || 'Ingeniería de Sistemas',
        semester: Number(p.semester || 8),
        role: idx === 0 ? 'Líder' : 'Miembro',
        status: 'joined',
      })),
    };
  };

  const currentProject = latestProject
    ? mapDbProjectToStudentProject(latestProject, false)
    : null;

  const distinctFairIds = new Set([
    ...memberships.map((m: any) => String(m.eventId)),
    ...userProjects.map((p: any) => String(p.eventId)),
  ]);

  return {
    profile: {
      id: userId,
      firstName: user.firstName || participantInfo.firstName || 'Estudiante',
      lastName: user.lastName || participantInfo.lastName || '',
      email: userEmail,
      studentCode: participantInfo.studentCode || '200145892',
      career:
        participantInfo.career || 'Ingeniería de Sistemas y Computación',
      semester: Number(participantInfo.semester || 8),
    },
    kpis: {
      totalFairs: Math.max(1, distinctFairIds.size),
      totalProjects: userProjects.length,
      totalAwards: 0,
    },
    currentProject,
    evaluation: currentProject ? { resultsPublished: false } : null,
    trajectory: sortedProjects.map((proj: any, index: number) => {
      const mapped = mapDbProjectToStudentProject(proj, index > 0);
      return {
        id: `traj_${proj.id}`,
        eventId: mapped.eventId,
        semester: mapped.semester || '2026-1',
        eventName: mapped.eventName,
        courseName: mapped.categoryName,
        projectName: mapped.name,
        isCurrent: index === 0,
        certificates: [],
        projectDetails: mapped,
        evaluation: { resultsPublished: false },
      };
    }),
    certificates: [],
  };
};

const resolveStudentStateForUser = (user: any): StudentDashboardData => {
  const email = String(user?.email ?? '').toLowerCase();
  if (email && scenarioStoreByEmail[email]) {
    return scenarioStoreByEmail[email];
  }
  return buildStudentDashboardFromDb(user);
};

/**
 * Resuelve el proyecto y evaluación de un estudiante para un `eventId` dado
 * aplicando las reglas de negocio de los Endpoints 2 y 3.
 */
const resolveEventProjectAndResults = (
  user: any,
  rawEventId: string | number,
): {
  project: StudentProjectInfo | null;
  evaluation: StudentEvaluation | null;
  isHistorical: boolean;
} => {
  const email = String(user?.email ?? '').toLowerCase();
  const baseData = resolveStudentStateForUser(user);
  const normalizedNumericId = toPublicNumericEventId(rawEventId);
  const strEventId = String(normalizedNumericId);

  // 1. Verificar si corresponde al proyecto activo del estudiante
  if (
    strEventId === 'current' ||
    (baseData.currentProject &&
      String(toPublicNumericEventId(baseData.currentProject.eventId)) ===
        strEventId)
  ) {
    const activeProject = baseData.currentProject
      ? {
          ...baseData.currentProject,
          canEdit:
            baseData.currentProject.enrollmentStatus === 'REQUEST_CHANGES',
        }
      : null;

    return {
      project: activeProject,
      evaluation: baseData.evaluation,
      isHistorical: false,
    };
  }

  // 2. Verificar si existe en la trayectoria histórica del estudiante
  const historicalMatch = baseData.trajectory.find((item) => {
    if (item.isCurrent) return false;
    return (
      String(item.eventId) === strEventId ||
      item.id === String(rawEventId) ||
      String(rawEventId).includes(item.id)
    );
  });

  if (historicalMatch) {
    // Reutilizar el helper determinista de fixtures para construir el detalle histórico si no está explícito
    const resolvedFromFixture = getStudentDashboardDataByEmail(
      email || baseData.profile.email,
      normalizedNumericId,
    );
    const historicalProject = resolvedFromFixture.currentProject
      ? {
          ...resolvedFromFixture.currentProject,
          // Regla de negocio Endpoint 2: Si el evento ya terminó o está cerrado -> canEdit: false
          canEdit: false,
        }
      : null;

    return {
      project: historicalProject,
      evaluation: resolvedFromFixture.evaluation,
      isHistorical: true,
    };
  }

  // 3. Buscar en db.project por si fue inscrito dinámicamente en otro evento
  const internalEventId = toInternalPrefixedEventId(rawEventId);
  const dbProj = db.project
    .getAll()
    .find(
      (p: any) =>
        (String(p.eventId) === internalEventId ||
          String(p.eventId) === strEventId) &&
        (p.participants ?? []).some(
          (part: any) => String(part?.email ?? '').toLowerCase() === email,
        ),
    );

  if (dbProj) {
    const event = db.event.findFirst({
      where: { id: { equals: String(dbProj.eventId) } },
    });
    const isClosed = event?.active === false || event?.status === 4;
    const rawState = String(dbProj.state || 'UNDER_REVIEW').toUpperCase();
    const enrollmentStatus: EnrollmentStatus =
      rawState === 'APPROVED' ||
      rawState === 'REQUEST_CHANGES' ||
      rawState === 'REJECTED' ||
      rawState === 'PENDING' ||
      rawState === 'UNDER_REVIEW'
        ? (rawState as EnrollmentStatus)
        : 'UNDER_REVIEW';

    return {
      project: {
        id: dbProj.id,
        eventId: normalizedNumericId,
        eventName: event?.name || 'Feria de Proyectos',
        semester: '2026-1',
        projectCode: dbProj.projectCode || 'PROY-2026-001',
        name: dbProj.name,
        description: dbProj.description || '',
        categoryName: 'Ingeniería & Tecnología',
        enrollmentStatus,
        canEdit: !isClosed && enrollmentStatus === 'REQUEST_CHANGES',
        documents: (dbProj.documents ?? []).map((d: any, i: number) => ({
          id: d.id || `doc_${i + 1}`,
          type: d.type || 'POSTER',
          title: d.title || 'Documento del Proyecto',
          url: d.url || 'https://storage.uninorte.edu.co/docs/poster.pdf',
          createdAt: dbProj.createdAt,
        })),
        participants: (dbProj.participants ?? []).map((p: any, i: number) => ({
          id: p.id || `usr_${i + 1}`,
          firstName: p.firstName || '',
          lastName: p.lastName || '',
          email: p.email || '',
          studentCode: p.studentCode || '200100000',
          career: p.career || 'Ingeniería',
          semester: Number(p.semester || 8),
          role: i === 0 ? 'Líder' : 'Miembro',
          status: 'joined',
        })),
      },
      evaluation: {
        resultsPublished: false,
      },
      isHistorical: isClosed,
    };
  }

  return {
    project: null,
    evaluation: null,
    isHistorical: false,
  };
};

/**
 * Busca un certificado por ID en todos los escenarios activos y del usuario
 */
const findCertificateById = (
  certificateId: string,
  user?: any,
): DiplomaCertificate | null => {
  const pools: StudentDashboardData[] = [];
  if (user) {
    pools.push(resolveStudentStateForUser(user));
  }
  pools.push(...Object.values(scenarioStoreByEmail), scenarioPublishedRegular);

  for (const data of pools) {
    const fromTop = (data.certificates ?? []).find(
      (c) => String(c.id) === String(certificateId),
    );
    if (fromTop) return fromTop;

    for (const traj of data.trajectory ?? []) {
      const fromTraj = (traj.certificates ?? []).find(
        (c) => String(c.id) === String(certificateId),
      );
      if (fromTraj) return fromTraj;
    }
  }

  return null;
};

/**
 * Genera los prefijos de ruta soportados tanto por `mock-server.ts` (`${env.API_URL}`),
 * como por MSW en navegador/Vitest (`/api`) y llamadas directas al contrato `/api/v1`.
 */
const buildApiPaths = (path: string): string[] => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const prefixes = new Set<string>(['/api', '/api/v1']);

  if (env.API_URL) {
    const cleanApiUrl = env.API_URL.replace(/\/+$/, '');
    prefixes.add(cleanApiUrl);
    prefixes.add(`${cleanApiUrl}/api/v1`);
  }

  return Array.from(prefixes).map((prefix) => `${prefix}${normalizedPath}`);
};

/**
 * ============================================================================
 * HANDLERS DE LOS 5 ENDPOINTS DEL DOCUMENTO DE INTEGRACIÓN BACKEND [CU-86e3vmxb2]
 * ============================================================================
 */

// 1. GET /api/v1/students/me/dashboard (Vista general /app)
const getStudentDashboardHandler = async ({
  cookies,
}: {
  cookies: Record<string, string>;
}) => {
  await networkDelay();

  try {
    const { user, error } = requireAuth(cookies);
    if (error || !user) {
      return HttpResponse.json(
        { message: error || 'Unauthorized' },
        { status: 401 },
      );
    }

    const data = resolveStudentStateForUser(user);
    const currentProject = data.currentProject;

    return HttpResponse.json({
      profile: data.profile,
      kpis: data.kpis,
      currentProject: currentProject
        ? {
            id: currentProject.id,
            eventId: currentProject.eventId,
            eventName: currentProject.eventName,
            semester: currentProject.semester || '2026-1',
            projectCode: currentProject.projectCode,
            name: currentProject.name,
            description: currentProject.description,
            categoryName: currentProject.categoryName,
            enrollmentStatus: currentProject.enrollmentStatus,
            canEdit:
              currentProject.enrollmentStatus === 'REQUEST_CHANGES',
            participantsCount:
              currentProject.participantsCount ??
              currentProject.participants?.length ??
              1,
            documentsCount:
              currentProject.documentsCount ??
              currentProject.documents?.length ??
              0,
          }
        : null,
      evaluation: data.evaluation
        ? data.evaluation.resultsPublished
          ? {
              resultsPublished: true,
              finalScore: data.evaluation.finalScore,
            }
          : {
              resultsPublished: false,
            }
        : null,
      trajectory: (data.trajectory ?? []).map((item) => ({
        id: item.id,
        eventId: item.eventId,
        semester: item.semester,
        eventName: item.eventName,
        courseName: item.courseName,
        projectName: item.projectName,
        ...(item.finalScore !== undefined && { finalScore: item.finalScore }),
        ...(item.award && { award: item.award }),
        isCurrent: Boolean(item.isCurrent),
        certificates: (item.certificates ?? []).map((cert) => ({
          id: cert.id,
          eventId: cert.eventId ?? item.eventId,
          title: cert.title,
          eventName: cert.eventName || item.eventName,
          semester: cert.semester || item.semester,
          type: cert.type,
          isIssued: cert.isIssued,
          ...(cert.isIssued && {
            downloadUrl: `/api/certificates/${encodeURIComponent(String(cert.id))}/download`,
          }),
          ...(cert.issuedDate && { issuedDate: cert.issuedDate }),
        })),
      })),
    });
  } catch (err: any) {
    return HttpResponse.json(
      { message: err?.message || 'Server Error' },
      { status: 500 },
    );
  }
};

// 2. GET /api/v1/events/:eventId/my-project (Ficha técnica de proyecto)
const getStudentEventProjectHandler = async ({
  cookies,
  params,
}: {
  cookies: Record<string, string>;
  params: Record<string, any>;
}) => {
  await networkDelay();

  try {
    const { user, error } = requireAuth(cookies);
    if (error || !user) {
      return HttpResponse.json(
        { message: error || 'Unauthorized' },
        { status: 401 },
      );
    }

    const rawEventId = String(params.eventId ?? '').trim();
    if (!rawEventId || rawEventId === 'undefined' || rawEventId === 'NaN') {
      return HttpResponse.json(
        { message: 'Missing eventId' },
        { status: 400 },
      );
    }

    const { project } = resolveEventProjectAndResults(user, rawEventId);

    if (!project) {
      return HttpResponse.json(
        { message: 'No project found for this user in the specified event' },
        { status: 404 },
      );
    }

    return HttpResponse.json({
      id: project.id,
      eventId: project.eventId,
      eventName: project.eventName,
      semester: project.semester || '2026-1',
      projectCode: project.projectCode,
      name: project.name,
      description: project.description,
      categoryName: project.categoryName,
      enrollmentStatus: project.enrollmentStatus,
      canEdit: Boolean(project.canEdit),
      documents: project.documents ?? [],
      participants: project.participants ?? [],
    });
  } catch (err: any) {
    return HttpResponse.json(
      { message: err?.message || 'Server Error' },
      { status: 500 },
    );
  }
};

// 3. GET /api/v1/events/:eventId/my-project/results (Notas consolidadas y rúbricas)
const getStudentEventResultsHandler = async ({
  cookies,
  params,
}: {
  cookies: Record<string, string>;
  params: Record<string, any>;
}) => {
  await networkDelay();

  try {
    const { user, error } = requireAuth(cookies);
    if (error || !user) {
      return HttpResponse.json(
        { message: error || 'Unauthorized' },
        { status: 401 },
      );
    }

    const rawEventId = String(params.eventId ?? '').trim();
    const { project, evaluation } = resolveEventProjectAndResults(
      user,
      rawEventId,
    );

    if (!project) {
      return HttpResponse.json(
        { message: 'No project found for this user in the specified event' },
        { status: 404 },
      );
    }

    // Regla 1 (Gating de Publicación): Si la administración no ha oficializado notas,
    // retornar estrictamente {"resultsPublished": false} sin filtrar notas parciales ni jurados.
    if (!evaluation || !evaluation.resultsPublished) {
      return HttpResponse.json({
        resultsPublished: false,
      });
    }

    // Regla 2 y 3 (Anonimización estricta y privacidad de competidores):
    return HttpResponse.json({
      resultsPublished: true,
      finalScore: evaluation.finalScore ?? 0,
      maxScore: evaluation.maxScore ?? 5.0,
      ranking: evaluation.ranking,
      criteriaScores: (evaluation.criteriaScores ?? []).map((crit) => ({
        id: crit.id,
        criterion: crit.criterion,
        ...(crit.component && { component: crit.component }),
        ...(crit.weight !== undefined && { weight: crit.weight }),
        score: crit.score,
        maxScore: crit.maxScore ?? 5.0,
      })),
      consolidatedFeedback: evaluation.consolidatedFeedback ?? '',
    });
  } catch (err: any) {
    return HttpResponse.json(
      { message: err?.message || 'Server Error' },
      { status: 500 },
    );
  }
};

// 4. PATCH /api/v1/projects/:projectId (Modificación de propuesta por ajustes solicitados)
const patchStudentProjectHandler = async ({
  cookies,
  request,
  params,
}: {
  cookies: Record<string, string>;
  request: Request;
  params: Record<string, any>;
}) => {
  await networkDelay();

  try {
    const { user, error } = requireAuth(cookies);
    if (error || !user) {
      return HttpResponse.json(
        { message: error || 'Unauthorized' },
        { status: 401 },
      );
    }

    const projectId = String(params.projectId ?? '').trim();
    const body = (await request.json()) as {
      name?: string;
      description?: string;
    };

    if (!body || (!body.name?.trim() && !body.description?.trim())) {
      return HttpResponse.json(
        { message: 'name or description is required' },
        { status: 400 },
      );
    }

    const userEmail = String((user as any).email ?? '').toLowerCase();
    const studentState = scenarioStoreByEmail[userEmail];

    if (
      studentState?.currentProject &&
      String(studentState.currentProject.id) === projectId
    ) {
      const currentProj = studentState.currentProject;

      // Validar pertenencia al proyecto
      const isParticipant =
        currentProj.participants.some(
          (p) => p.email.toLowerCase() === userEmail,
        ) || studentState.profile.email.toLowerCase() === userEmail;

      if (!isParticipant) {
        return HttpResponse.json(
          { message: 'No tienes permisos para modificar este proyecto' },
          { status: 403 },
        );
      }

      // Regla de negocio Endpoint 4: Solo editable si enrollmentStatus === 'REQUEST_CHANGES'
      if (currentProj.enrollmentStatus !== 'REQUEST_CHANGES') {
        return HttpResponse.json(
          {
            message:
              'El proyecto ya se encuentra aprobado y no admite modificaciones directas',
          },
          { status: 403 },
        );
      }

      const updatedName = body.name?.trim() || currentProj.name;
      const updatedDescription =
        body.description?.trim() ?? currentProj.description;

      currentProj.name = updatedName;
      currentProj.description = updatedDescription;
      currentProj.enrollmentStatus = 'UNDER_REVIEW';
      currentProj.canEdit = false;

      // Actualizar también el nombre en el ítem actual de la trayectoria
      const currentTraj = studentState.trajectory.find((t) => t.isCurrent);
      if (currentTraj) {
        currentTraj.projectName = updatedName;
      }

      return HttpResponse.json({
        ...currentProj,
      });
    }

    // Buscar también en db.project si es un proyecto de la BD general
    const dbProj = db.project.findFirst({
      where: { id: { equals: projectId } },
    });

    if (!dbProj) {
      return HttpResponse.json(
        { message: 'Project not found' },
        { status: 404 },
      );
    }

    const isDbParticipant = (dbProj.participants ?? []).some(
      (p: any) => String(p?.email ?? '').toLowerCase() === userEmail,
    );

    if (!isDbParticipant && (user as any).role !== 'ADMIN') {
      return HttpResponse.json(
        { message: 'No tienes permisos para modificar este proyecto' },
        { status: 403 },
      );
    }

    if (String(dbProj.state) !== 'REQUEST_CHANGES') {
      return HttpResponse.json(
        {
          message:
            'El proyecto ya se encuentra aprobado y no admite modificaciones directas',
        },
        { status: 403 },
      );
    }

    const updatedDbProj = db.project.update({
      where: { id: { equals: projectId } },
      data: {
        name: body.name?.trim() || dbProj.name,
        description: body.description?.trim() ?? dbProj.description,
        state: 'UNDER_REVIEW',
      },
    });

    await persistDb('project');

    return HttpResponse.json({
      id: updatedDbProj?.id ?? projectId,
      eventId: toPublicNumericEventId(String(updatedDbProj?.eventId ?? 3)),
      name: updatedDbProj?.name,
      description: updatedDbProj?.description,
      enrollmentStatus: 'UNDER_REVIEW',
      canEdit: false,
    });
  } catch (err: any) {
    return HttpResponse.json(
      { message: err?.message || 'Server Error' },
      { status: 500 },
    );
  }
};

// 5. GET /api/v1/certificates/:certificateId/download (Descarga de certificados oficiales)
const downloadCertificateHandler = async ({
  cookies,
  params,
}: {
  cookies: Record<string, string>;
  params: Record<string, any>;
}) => {
  await networkDelay();

  try {
    const { user } = requireAuth(cookies);
    const certificateId = String(params.certificateId ?? '').trim();

    const certificate = findCertificateById(certificateId, user);

    if (!certificate) {
      return HttpResponse.json(
        { message: 'Certificado no encontrado' },
        { status: 404 },
      );
    }

    // Regla de negocio Endpoint 5: Si certificate.isIssued === false -> 409 Conflict
    if (!certificate.isIssued) {
      return HttpResponse.json(
        {
          message:
            'El certificado aún se encuentra en trámite de emisión institucional',
        },
        { status: 409 },
      );
    }

    const safeFileName = `Diploma_${certificate.id.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
    const minimalPdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>
endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer
<< /Size 4 /Root 1 0 R >>
startxref
190
%%EOF`;

    return new HttpResponse(minimalPdfContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFileName}"`,
      },
    });
  } catch (err: any) {
    return HttpResponse.json(
      { message: err?.message || 'Server Error' },
      { status: 500 },
    );
  }
};

export const studentDashboardHandlers = [
  ...buildApiPaths('/students/me/dashboard').map((url) =>
    http.get(url, getStudentDashboardHandler),
  ),
  ...buildApiPaths('/events/:eventId/my-project').map((url) =>
    http.get(url, getStudentEventProjectHandler),
  ),
  ...buildApiPaths('/events/:eventId/my-project/results').map((url) =>
    http.get(url, getStudentEventResultsHandler),
  ),
  ...buildApiPaths('/projects/:projectId').map((url) =>
    http.patch(url, patchStudentProjectHandler),
  ),
  ...buildApiPaths('/certificates/:certificateId/download').map((url) =>
    http.get(url, downloadCertificateHandler),
  ),
];
