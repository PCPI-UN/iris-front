import { StudentDashboardData } from '../types';

/**
 * Escenario 1: Estudiante con registro en revisión / Cambios solicitados
 * - Estado: REQUEST_CHANGES
 * - Edición de proyecto habilitada (canEdit = true)
 * - Calificaciones ocultas (sin evaluación)
 */
export const scenarioInReview: StudentDashboardData = {
  profile: {
    id: 'user-student-review',
    firstName: 'Laura',
    lastName: 'Herrera',
    email: 'student.review@iris.com',
    studentCode: '200189441',
    career: 'Ingeniería de Sistemas y Computación',
    semester: 7,
  },
  kpis: {
    totalFairs: 2,
    totalProjects: 2,
    totalAwards: 0,
  },
  currentProject: {
    id: 'proj-review-001',
    eventId: 3,
    eventName: 'Feria de Ingeniería & Ciencias 2026-1',
    semester: '2026-1',
    projectCode: 'PROY-2026-042',
    name: 'Optimizador de Rutas para Transporte Masivo',
    description:
      'Algoritmo heurístico para reasignación dinámica de frecuencias de buses en horas pico según aforo sensorial en estaciones.',
    categoryName: 'Sistemas Inteligentes',
    enrollmentStatus: 'REQUEST_CHANGES',
    canEdit: true,
    documents: [
      {
        id: 'doc-rev-1',
        type: 'POSTER',
        title: 'Póster Preliminar (PDF)',
        url: 'https://example.com/poster-preliminar.pdf',
        createdAt: 1714000000000,
      },
    ],
    participants: [
      {
        id: 'part-rev-1',
        firstName: 'Laura',
        lastName: 'Herrera',
        email: 'student.review@iris.com',
        studentCode: '200189441',
        career: 'Ingeniería de Sistemas',
        semester: 7,
        role: 'Líder',
        status: 'joined',
      },
      {
        id: 'part-rev-2',
        firstName: 'Daniel',
        lastName: 'Suárez',
        email: 'daniel.suarez@iris.com',
        studentCode: '200189552',
        career: 'Ingeniería Industrial',
        semester: 8,
        role: 'Miembro',
        status: 'joined',
      },
    ],
  },
  evaluation: null,
  trajectory: [
    {
      id: 'traj-1',
      eventId: 3,
      semester: '2026-1',
      eventName: 'Feria de Ingeniería & Ciencias 2026-1',
      courseName: 'Diseño de Software 2',
      projectName: 'Optimizador de Rutas para Transporte Masivo',
      isCurrent: true,
      certificates: [],
    },
    {
      id: 'traj-rev-2',
      eventId: 2,
      semester: '2025-2',
      eventName: 'Feria de Innovación 2025-2',
      courseName: 'Estructuras de Datos',
      projectName: 'Simulador de Enrutamiento para Redes Definidas por Software',
      finalScore: 4.45,
      isCurrent: false,
      certificates: [
        {
          id: 'cert-rev-1',
          title: 'Certificado de Participación',
          eventName: 'Feria de Innovación 2025-2',
          semester: '2025-2',
          type: 'PARTICIPATION',
          isIssued: true,
          downloadUrl: 'https://example.com/diploma-laura-2025-2.pdf',
          issuedDate: '2025-11-25',
        },
      ],
    },
  ],
  certificates: [],
};

/**
 * Escenario 2: Estudiante en feria activa (Pre-publicación)
 * - Estado: APPROVED
 * - Calificaciones en proceso de consolidación (resultsPublished = false)
 * - Métricas y jurados completamente ocultos al estudiante
 */
export const scenarioPrePublication: StudentDashboardData = {
  profile: {
    id: 'user-student-prepub',
    firstName: 'Mateo',
    lastName: 'Vargas',
    email: 'student.prepub@iris.com',
    studentCode: '200175223',
    career: 'Ingeniería Electrónica',
    semester: 8,
  },
  kpis: {
    totalFairs: 2,
    totalProjects: 2,
    totalAwards: 0,
  },
  currentProject: {
    id: 'proj-prepub-002',
    eventId: 3,
    eventName: 'Feria de Ingeniería & Ciencias 2026-1',
    semester: '2026-1',
    projectCode: 'PROY-2026-077',
    name: 'Dispositivo IoT para Monitorización de Calidad del Aire en Aulas',
    description:
      'Red de nodos sensoriales autónomos para registro de CO2, partículas PM2.5 y confort térmico en recintos cerrados universitarios.',
    categoryName: 'Hardware & IoT',
    enrollmentStatus: 'APPROVED',
    canEdit: false,
    documents: [
      {
        id: 'doc-prepub-1',
        type: 'POSTER',
        title: 'Póster Oficial de Exposición (PDF)',
        url: 'https://example.com/poster-oficial.pdf',
        createdAt: 1714500000000,
      },
      {
        id: 'doc-prepub-2',
        type: 'SUPPORTING_DOCUMENT',
        title: 'Memoria Técnica y Firmware',
        url: 'https://example.com/memoria-tecnica.pdf',
        createdAt: 1714500100000,
      },
    ],
    participants: [
      {
        id: 'part-pre-1',
        firstName: 'Mateo',
        lastName: 'Vargas',
        email: 'student.prepub@iris.com',
        studentCode: '200175223',
        career: 'Ingeniería Electrónica',
        semester: 8,
        role: 'Líder',
        status: 'joined',
      },
    ],
  },
  evaluation: {
    resultsPublished: false,
  },
  trajectory: [
    {
      id: 'traj-pre-1',
      eventId: 3,
      semester: '2026-1',
      eventName: 'Feria de Ingeniería & Ciencias 2026-1',
      courseName: 'Sistemas Embebidos',
      projectName: 'Dispositivo IoT para Monitorización de Calidad del Aire',
      isCurrent: true,
      certificates: [],
    },
    {
      id: 'traj-pre-2',
      eventId: 2,
      semester: '2025-2',
      eventName: 'Feria de Innovación 2025-2',
      courseName: 'Circuitos Digitales',
      projectName: 'Sensor ultrasónico de presencia para iluminación inteligente',
      finalScore: 4.2,
      isCurrent: false,
      certificates: [
        {
          id: 'cert-pre-1',
          title: 'Certificado de Participación',
          eventName: 'Feria de Innovación 2025-2',
          semester: '2025-2',
          type: 'PARTICIPATION',
          isIssued: true,
          downloadUrl: 'https://example.com/diploma-2025-2.pdf',
          issuedDate: '2025-11-20',
        },
      ],
    },
  ],
  certificates: [
    {
      id: 'cert-pre-1',
      title: 'Certificado de Participación',
      eventName: 'Feria de Innovación 2025-2',
      semester: '2025-2',
      type: 'PARTICIPATION',
      isIssued: true,
      downloadUrl: 'https://example.com/diploma-2025-2.pdf',
      issuedDate: '2025-11-20',
    },
  ],
};

/**
 * Escenario 3: Estudiante con resultados publicados (Caso Regular)
 * - resultsPublished = true
 * - Puntaje final consolidado (4.38/5.0), posición en ranking (Puesto 3)
 * - Desglose de criterios promediado y observaciones consolidadas anónimas
 */
export const scenarioPublishedRegular: StudentDashboardData = {
  profile: {
    id: 'user-002',
    firstName: 'María',
    lastName: 'García',
    email: 'maria@iris.com',
    studentCode: '200145892',
    career: 'Ingeniería de Sistemas y Computación',
    semester: 8,
  },
  kpis: {
    totalFairs: 3,
    totalProjects: 2,
    totalAwards: 1,
  },
  currentProject: {
    id: 'proj-reg-003',
    eventId: 3,
    eventName: 'Feria de Ingeniería & Ciencias 2026-1',
    semester: '2026-1',
    projectCode: 'PROY-2026-088',
    name: 'Plataforma Inteligente de Detección de Fugas Hidráulicas con Edge-AI',
    description:
      'Sistema de inspección acústica embebida para tuberías matrices de acueducto con algoritmos ligeros de inferencia.',
    categoryName: 'Ingeniería de Software & AI',
    enrollmentStatus: 'APPROVED',
    canEdit: false,
    documents: [
      {
        id: 'doc-reg-1',
        type: 'POSTER',
        title: 'Póster de Proyecto (PDF)',
        url: 'https://example.com/poster-fugas.pdf',
        createdAt: 1715000000000,
      },
      {
        id: 'doc-reg-2',
        type: 'SUPPORTING_DOCUMENT',
        title: 'Documento de Arquitectura y Pruebas',
        url: 'https://example.com/docs-fugas.pdf',
        createdAt: 1715000500000,
      },
    ],
    participants: [
      {
        id: 'part-reg-1',
        firstName: 'María',
        lastName: 'García',
        email: 'maria@iris.com',
        studentCode: '200145892',
        career: 'Ingeniería de Sistemas',
        semester: 8,
        role: 'Líder',
        status: 'joined',
      },
      {
        id: 'part-reg-2',
        firstName: 'Alejandro',
        lastName: 'Montes',
        email: 'alejandro.montes@iris.com',
        studentCode: '200145999',
        career: 'Ingeniería Mecánica',
        semester: 8,
        role: 'Miembro',
        status: 'joined',
      },
    ],
  },
  evaluation: {
    resultsPublished: true,
    finalScore: 4.38,
    maxScore: 5.0,
    ranking: {
      position: 3,
      isWinner: false,
      isCoWinner: false,
      categoryName: 'Ingeniería de Software & AI',
      awardTitle: 'Tercer Lugar - Mención Destacada',
    },
    criteriaScores: [
      {
        id: 'crit-1',
        criterion: 'Planteamiento del Problema y Justificación',
        component: 'Fundamentación',
        weight: 25,
        score: 4.5,
        maxScore: 5.0,
      },
      {
        id: 'crit-2',
        criterion: 'Rigor Metodológico e Implementación Técnica',
        component: 'Desarrollo',
        weight: 35,
        score: 4.4,
        maxScore: 5.0,
      },
      {
        id: 'crit-3',
        criterion: 'Validación Experimental y Resultados Obtenidos',
        component: 'Resultados',
        weight: 20,
        score: 4.2,
        maxScore: 5.0,
      },
      {
        id: 'crit-4',
        criterion: 'Claridad en Sustentación Oral y Defensa Técnica',
        component: 'Comunicación',
        weight: 20,
        score: 4.4,
        maxScore: 5.0,
      },
    ],
    consolidatedFeedback:
      'Solución sólida y técnicamente bien estructurada. La demostración en vivo evidenció buena respuesta ante señales acústicas sintetizadas. Como oportunidad de mejora, se recomienda ampliar la base de datos de entrenamiento en escenarios con ruido vehicular.',
  },
  trajectory: [
    {
      id: 'traj-reg-1',
      eventId: 3,
      semester: '2026-1',
      eventName: 'Feria de Ingeniería & Ciencias 2026-1',
      courseName: 'Diseño de Software 2',
      projectName: 'Plataforma Inteligente de Detección de Fugas Hidráulicas',
      finalScore: 4.38,
      award: '3° Lugar',
      isCurrent: true,
      certificates: [
        {
          id: 'cert-reg-1',
          eventId: 3,
          title: 'Mención Destacada - 3° Puesto',
          eventName: 'Feria de Ingeniería & Ciencias 2026-1',
          semester: '2026-1',
          type: 'HONOR_MENTION',
          isIssued: true,
          downloadUrl: 'https://example.com/diploma-2026-1.pdf',
          issuedDate: '2026-06-15',
        },
      ],
    },
    {
      id: 'traj-reg-2',
      eventId: 2,
      semester: '2025-2',
      eventName: 'Feria de Ciencias 2025-2',
      courseName: 'Bases de Datos Avanzadas',
      projectName: 'Motor de Búsqueda Semántica para Tesis Uninorte',
      finalScore: 4.7,
      award: 'Mención de Honor',
      isCurrent: false,
      certificates: [
        {
          id: 'cert-reg-2',
          eventId: 2,
          title: 'Mención de Honor',
          eventName: 'Feria de Ciencias 2025-2',
          semester: '2025-2',
          type: 'HONOR_MENTION',
          isIssued: true,
          downloadUrl: 'https://example.com/diploma-2025-2.pdf',
          issuedDate: '2025-11-28',
        },
      ],
      projectDetails: {
        id: 'proj-reg-hist-002',
        eventId: 2,
        eventName: 'Feria de Ciencias 2025-2',
        semester: '2025-2',
        projectCode: 'PROY-2025-118',
        name: 'Motor de Búsqueda Semántica para Tesis Uninorte',
        description:
          'Plataforma de indexación vectorial y búsqueda basada en embeddings sobre el repositorio institucional de pregrado y posgrado de Uninorte.',
        categoryName: 'Inteligencia Artificial',
        enrollmentStatus: 'APPROVED',
        canEdit: false,
        documents: [
          {
            id: 'doc-hist-poster-1',
            type: 'POSTER',
            title: 'Póster de Divulgación Académica (PDF)',
            url: 'https://example.com/poster-tesis-uninorte.pdf',
            createdAt: 1732000000000,
          },
          {
            id: 'doc-hist-mem-1',
            type: 'DOCUMENT',
            title: 'Memoria Técnica y Arquitectura de Embeddings',
            url: 'https://example.com/memoria-tecnica-tesis.pdf',
            createdAt: 1732000000000,
          },
        ],
        participants: [
          {
            id: 'part-hist-1',
            firstName: 'María',
            lastName: 'García',
            email: 'maria@iris.com',
            studentCode: '200145892',
            career: 'Ingeniería de Sistemas y Computación',
            semester: 7,
            role: 'Líder',
            status: 'joined',
          },
          {
            id: 'part-hist-2',
            firstName: 'Andrés',
            lastName: 'Mendoza',
            email: 'andres.mendoza@iris.com',
            studentCode: '200145899',
            career: 'Ingeniería de Sistemas',
            semester: 7,
            role: 'Miembro',
            status: 'joined',
          },
        ],
      },
      evaluation: {
        resultsPublished: true,
        finalScore: 4.7,
        maxScore: 5.0,
        ranking: {
          position: 2,
          isWinner: false,
          isCoWinner: false,
          categoryName: 'Inteligencia Artificial',
          awardTitle: 'Mención de Honor',
        },
        criteriaScores: [
          {
            id: 'crit-hist-1',
            criterion: 'Innovación Tecnológica',
            component: 'Técnico',
            score: 4.8,
            maxScore: 5.0,
          },
          {
            id: 'crit-hist-2',
            criterion: 'Impacto Comunitario y Aplicabilidad',
            component: 'Impacto',
            score: 4.6,
            maxScore: 5.0,
          },
          {
            id: 'crit-hist-3',
            criterion: 'Sustentación y Dominio Temático',
            component: 'Comunicación',
            score: 4.7,
            maxScore: 5.0,
          },
        ],
        consolidatedFeedback:
          'Destacable rigor en el procesamiento del corpus bibliográfico y óptimo rendimiento del motor semántico. El jurado resalta el valor añadido para la comunidad investigadora de la universidad.',
      },
    },
  ],
  certificates: [
    {
      id: 'cert-reg-1',
      title: 'Mención Destacada - 3° Puesto',
      eventName: 'Feria de Ingeniería & Ciencias 2026-1',
      semester: '2026-1',
      type: 'HONOR_MENTION',
      isIssued: true,
      downloadUrl: 'https://example.com/diploma-2026-1.pdf',
      issuedDate: '2026-06-15',
    },
    {
      id: 'cert-reg-2',
      title: 'Mención de Honor',
      eventName: 'Feria de Ciencias 2025-2',
      semester: '2025-2',
      type: 'HONOR_MENTION',
      isIssued: true,
      downloadUrl: 'https://example.com/diploma-2025-2.pdf',
      issuedDate: '2025-11-28',
    },
  ],
};

/**
 * Escenario 4: Estudiante premiado con empate (Coganador)
 * - resultsPublished = true
 * - Puntaje final sobresaliente (4.88/5.0)
 * - Distinción de "Coganador" (empate técnico en 1° Puesto)
 * - Diploma de Coganador listo para descarga inmediata
 */
export const scenarioCoWinnerTie: StudentDashboardData = {
  profile: {
    id: 'user-student-winner',
    firstName: 'Valeria',
    lastName: 'Ríos',
    email: 'student.winner@iris.com',
    studentCode: '200133481',
    career: 'Ingeniería Biomédica',
    semester: 9,
  },
  kpis: {
    totalFairs: 3,
    totalProjects: 3,
    totalAwards: 2,
  },
  currentProject: {
    id: 'proj-win-004',
    eventId: 3,
    eventName: 'Feria de Ingeniería & Ciencias 2026-1',
    semester: '2026-1',
    projectCode: 'PROY-2026-001',
    name: 'Prótesis Mioeléctrica Transradial con Algoritmos de Aprendizaje Profundo',
    description:
      'Diseño mecánico biomecatrónico con control mioeléctrico adaptativo en tiempo real basado en clasificación de electromiografía de superficie (sEMG).',
    categoryName: 'Bioingeniería & Salud',
    enrollmentStatus: 'APPROVED',
    canEdit: false,
    documents: [
      {
        id: 'doc-win-1',
        type: 'POSTER',
        title: 'Póster Científico Ganador (PDF)',
        url: 'https://example.com/poster-protesis.pdf',
        createdAt: 1715500000000,
      },
      {
        id: 'doc-win-2',
        type: 'SUPPORTING_DOCUMENT',
        title: 'Estudio de Validación Clínica y Cinemática',
        url: 'https://example.com/estudio-clinico.pdf',
        createdAt: 1715500200000,
      },
    ],
    participants: [
      {
        id: 'part-win-1',
        firstName: 'Valeria',
        lastName: 'Ríos',
        email: 'student.winner@iris.com',
        studentCode: '200133481',
        career: 'Ingeniería Biomédica',
        semester: 9,
        role: 'Líder',
        status: 'joined',
      },
    ],
  },
  evaluation: {
    resultsPublished: true,
    finalScore: 4.88,
    maxScore: 5.0,
    ranking: {
      position: 1,
      isWinner: true,
      isCoWinner: true,
      categoryName: 'Bioingeniería & Salud',
      awardTitle: 'Primer Lugar - Coganador Mención de Honor',
    },
    criteriaScores: [
      {
        id: 'crit-w1',
        criterion: 'Innovación, Impacto Social y Viabilidad Clínica',
        component: 'Impacto',
        weight: 30,
        score: 4.95,
        maxScore: 5.0,
      },
      {
        id: 'crit-w2',
        criterion: 'Diseño Hardware e Integración Sensorial',
        component: 'Ingeniería',
        weight: 30,
        score: 4.85,
        maxScore: 5.0,
      },
      {
        id: 'crit-w3',
        criterion: 'Procesamiento de Señales sEMG y Precisión del Modelo',
        component: 'Algoritmia',
        weight: 20,
        score: 4.85,
        maxScore: 5.0,
      },
      {
        id: 'crit-w4',
        criterion: 'Claridad Expositiva, Sustentación y Respuestas',
        component: 'Sustentación',
        weight: 20,
        score: 4.87,
        maxScore: 5.0,
      },
    ],
    consolidatedFeedback:
      'Proyecto excepcional con altísimo rigor metodológico e impacto humano tangible. La respuesta háptica y el control mioeléctrico adaptativo superaron las expectativas para nivel de pregrado. ¡Felicitaciones al equipo!',
  },
  trajectory: [
    {
      id: 'traj-win-1',
      eventId: 3,
      semester: '2026-1',
      eventName: 'Feria de Ingeniería & Ciencias 2026-1',
      courseName: 'Proyecto Final de Ingeniería Biomédica',
      projectName: 'Prótesis Mioeléctrica Transradial con Aprendizaje Profundo',
      finalScore: 4.88,
      award: '1° Puesto - Coganador',
      isCurrent: true,
      certificates: [
        {
          id: 'cert-win-1',
          title: 'Diploma de Honor: Primer Lugar - Coganador',
          eventName: 'Feria de Ingeniería & Ciencias 2026-1',
          semester: '2026-1',
          type: 'CO_WINNER',
          isIssued: true,
          downloadUrl: 'https://example.com/diploma-primer-lugar-coganador.pdf',
          issuedDate: '2026-06-20',
        },
      ],
    },
    {
      id: 'traj-win-2',
      eventId: 2,
      semester: '2025-2',
      eventName: 'Feria de Ciencias 2025-2',
      courseName: 'Biomecánica',
      projectName: 'Exoesqueleto de Asistencia para Miembro Superior',
      finalScore: 4.8,
      award: '1° Puesto',
      isCurrent: false,
      certificates: [
        {
          id: 'cert-win-2',
          title: 'Diploma de Honor: Primer Lugar',
          eventName: 'Feria de Ciencias 2025-2',
          semester: '2025-2',
          type: 'WINNER',
          isIssued: true,
          downloadUrl: 'https://example.com/diploma-primer-lugar-2025-2.pdf',
          issuedDate: '2025-11-30',
        },
      ],
    },
  ],
  certificates: [
    {
      id: 'cert-win-1',
      title: 'Diploma de Honor: Primer Lugar - Coganador',
      eventName: 'Feria de Ingeniería & Ciencias 2026-1',
      semester: '2026-1',
      type: 'CO_WINNER',
      isIssued: true,
      downloadUrl: 'https://example.com/diploma-primer-lugar-coganador.pdf',
      issuedDate: '2026-06-20',
    },
    {
      id: 'cert-win-2',
      title: 'Diploma de Honor: Primer Lugar',
      eventName: 'Feria de Ciencias 2025-2',
      semester: '2025-2',
      type: 'WINNER',
      isIssued: true,
      downloadUrl: 'https://example.com/diploma-primer-lugar-2025-2.pdf',
      issuedDate: '2025-11-30',
    },
  ],
};

/**
 * Escenario 5: Estudiante con trayectoria histórica consolidada
 * - 4 participaciones semestrales documentadas
 * - Evento actual en curso con diploma "En proceso de emisión"
 * - Diplomas anteriores listos para descarga
 */
export const scenarioHistoricalTrajectory: StudentDashboardData = {
  profile: {
    id: 'user-003',
    firstName: 'Carlos',
    lastName: 'López',
    email: 'carlos@iris.com',
    studentCode: '200112903',
    career: 'Ingeniería de Sistemas y Computación',
    semester: 10,
  },
  kpis: {
    totalFairs: 4,
    totalProjects: 4,
    totalAwards: 2,
  },
  currentProject: {
    id: 'proj-hist-005',
    eventId: 3,
    eventName: 'Feria de Ingeniería & Ciencias 2026-1',
    semester: '2026-1',
    projectCode: 'PROY-2026-105',
    name: 'Sistema Distribuido para Simulación de Dinámica de Fluidos en GPU',
    description:
      'Framework computacional de alto rendimiento para modelado de dispersión de contaminantes costeros utilizando CUDA y MPI.',
    categoryName: 'Computación Científica & HPC',
    enrollmentStatus: 'APPROVED',
    canEdit: false,
    documents: [
      {
        id: 'doc-hist-1',
        type: 'POSTER',
        title: 'Póster de Graduación (PDF)',
        url: 'https://example.com/poster-gpu.pdf',
        createdAt: 1716000000000,
      },
    ],
    participants: [
      {
        id: 'part-hist-1',
        firstName: 'Carlos',
        lastName: 'López',
        email: 'carlos@iris.com',
        studentCode: '200112903',
        career: 'Ingeniería de Sistemas',
        semester: 10,
        role: 'Líder',
        status: 'joined',
      },
    ],
  },
  evaluation: {
    resultsPublished: true,
    finalScore: 4.65,
    maxScore: 5.0,
    ranking: {
      position: 2,
      isWinner: false,
      isCoWinner: false,
      categoryName: 'Computación Científica & HPC',
      awardTitle: 'Segundo Lugar - Distinción Especial',
    },
    criteriaScores: [
      {
        id: 'crit-h1',
        criterion: 'Arquitectura y Optimización de Cómputo Paralelo',
        component: 'HPC',
        weight: 35,
        score: 4.8,
        maxScore: 5.0,
      },
      {
        id: 'crit-h2',
        criterion: 'Precisión Numérica y Validación Física',
        component: 'Modelado',
        weight: 35,
        score: 4.6,
        maxScore: 5.0,
      },
      {
        id: 'crit-h3',
        criterion: 'Documentación de Código Abierto y Reproducibilidad',
        component: 'Entregables',
        weight: 30,
        score: 4.5,
        maxScore: 5.0,
      },
    ],
    consolidatedFeedback:
      'Impresionante optimización de núcleos CUDA y manejo de memoria unificada. Los tiempos de cómputo se redujeron en un orden de magnitud respecto a soluciones en CPU.',
  },
  trajectory: [
    {
      id: 'traj-h-1',
      eventId: 3,
      semester: '2026-1',
      eventName: 'Feria de Ingeniería & Ciencias 2026-1',
      courseName: 'Proyecto de Grado 2',
      projectName: 'Sistema Distribuido para Simulación de Fluidos en GPU',
      finalScore: 4.65,
      award: '2° Lugar',
      isCurrent: true,
      certificates: [
        {
          id: 'cert-h-curr',
          eventId: 3,
          title: 'Diploma de Segundo Lugar',
          eventName: 'Feria de Ingeniería & Ciencias 2026-1',
          semester: '2026-1',
          type: 'HONOR_MENTION',
          isIssued: false, // En proceso de emisión oficial
        },
      ],
    },
    {
      id: 'traj-h-2',
      eventId: 2,
      semester: '2025-2',
      eventName: 'Feria de Innovación 2025-2',
      courseName: 'Computación Paralela',
      projectName: 'Acelerador de Renderizado Fotorrealista Ray-Tracing',
      finalScore: 4.75,
      award: 'Mención de Honor',
      isCurrent: false,
      certificates: [
        {
          id: 'cert-h-prev-1',
          eventId: 2,
          title: 'Diploma de Mención de Honor',
          eventName: 'Feria de Innovación 2025-2',
          semester: '2025-2',
          type: 'HONOR_MENTION',
          isIssued: true,
          downloadUrl: 'https://example.com/diploma-carlos-2025-2.pdf',
          issuedDate: '2025-11-29',
        },
      ],
      projectDetails: {
        id: 'proj-hist-carlos-002',
        eventId: 2,
        eventName: 'Feria de Innovación 2025-2',
        semester: '2025-2',
        projectCode: 'PROY-2025-064',
        name: 'Acelerador de Renderizado Fotorrealista Ray-Tracing',
        description:
          'Implementación de trazado de rayos acelerado por hardware para simulación visual interactiva de materiales translúcidos.',
        categoryName: 'Computación Gráfica',
        enrollmentStatus: 'APPROVED',
        canEdit: false,
        documents: [
          {
            id: 'doc-hist-carlos-1',
            type: 'POSTER',
            title: 'Póster de Ray-Tracing (PDF)',
            url: 'https://example.com/poster-raytracing.pdf',
            createdAt: 1732500000000,
          },
        ],
        participants: [
          {
            id: 'part-carlos-1',
            firstName: 'Carlos',
            lastName: 'López',
            email: 'carlos@iris.com',
            studentCode: '200112903',
            career: 'Ingeniería de Sistemas',
            semester: 9,
            role: 'Líder',
            status: 'joined',
          },
        ],
      },
      evaluation: {
        resultsPublished: true,
        finalScore: 4.75,
        maxScore: 5.0,
        ranking: {
          position: 1,
          isWinner: true,
          isCoWinner: false,
          categoryName: 'Computación Gráfica',
          awardTitle: 'Mención de Honor',
        },
        criteriaScores: [
          {
            id: 'crit-carlos-1',
            criterion: 'Eficiencia y Rendimiento Gráfico',
            component: 'Técnico',
            score: 4.9,
            maxScore: 5.0,
          },
          {
            id: 'crit-carlos-2',
            criterion: 'Innovación Algorítmica',
            component: 'Algoritmos',
            score: 4.6,
            maxScore: 5.0,
          },
        ],
        consolidatedFeedback:
          'Excelente desempeño del pipeline de renderizado y óptima utilización de buffers de aceleración BVH.',
      },
    },
    {
      id: 'traj-h-3',
      eventId: 4,
      semester: '2025-1',
      eventName: 'Semana de la Ingeniería 2025-1',
      courseName: 'Sistemas Operativos',
      projectName: 'Microkernel Educativo para Arquitectura RISC-V',
      finalScore: 4.5,
      isCurrent: false,
      certificates: [
        {
          id: 'cert-h-prev-2',
          eventId: 4,
          title: 'Certificado de Participación Destacada',
          eventName: 'Semana de la Ingeniería 2025-1',
          semester: '2025-1',
          type: 'PARTICIPATION',
          isIssued: true,
          downloadUrl: 'https://example.com/certificado-carlos-2025-1.pdf',
          issuedDate: '2025-05-18',
        },
      ],
    },
    {
      id: 'traj-h-4',
      eventId: 5,
      semester: '2024-2',
      eventName: 'Feria de Proyectos de Software 2024-2',
      courseName: 'Algoritmos y Complejidad',
      projectName: 'Visualizador de Algoritmos de Grafos en Grafeno',
      finalScore: 4.4,
      isCurrent: false,
      certificates: [
        {
          id: 'cert-h-prev-3',
          eventId: 5,
          title: 'Certificado de Participación Oficial',
          eventName: 'Feria de Proyectos de Software 2024-2',
          semester: '2024-2',
          type: 'PARTICIPATION',
          isIssued: true,
          downloadUrl: 'https://example.com/certificado-carlos-2024-2.pdf',
          issuedDate: '2024-11-20',
        },
      ],
    },
  ],
  certificates: [
    {
      id: 'cert-h-curr',
      title: 'Diploma de Segundo Lugar',
      eventName: 'Feria de Ingeniería & Ciencias 2026-1',
      semester: '2026-1',
      type: 'HONOR_MENTION',
      isIssued: false, // En proceso de emisión oficial
    },
    {
      id: 'cert-h-prev-1',
      title: 'Diploma de Mención de Honor',
      eventName: 'Feria de Innovación 2025-2',
      semester: '2025-2',
      type: 'HONOR_MENTION',
      isIssued: true,
      downloadUrl: 'https://example.com/diploma-carlos-2025-2.pdf',
      issuedDate: '2025-11-29',
    },
    {
      id: 'cert-h-prev-2',
      title: 'Certificado de Participación Destacada',
      eventName: 'Semana de la Ingeniería 2025-1',
      semester: '2025-1',
      type: 'PARTICIPATION',
      isIssued: true,
      downloadUrl: 'https://example.com/certificado-carlos-2025-1.pdf',
      issuedDate: '2025-05-18',
    },
  ],
};

/**
 * Mapa de resolución determinista de escenarios mock según el correo del usuario autenticado.
 */
export const studentMockScenariosByEmail: Record<string, StudentDashboardData> = {
  'student.review@iris.com': scenarioInReview,
  'student.prepub@iris.com': scenarioPrePublication,
  'maria@iris.com': scenarioPublishedRegular,
  'student.regular@iris.com': scenarioPublishedRegular,
  'student.winner@iris.com': scenarioCoWinnerTie,
  'carlos@iris.com': scenarioHistoricalTrajectory,
  'student.history@iris.com': scenarioHistoricalTrajectory,
};

const createHistoricalProjectFromTrajectory = (
  historicalItem: any,
  profile: any
) => {
  if (historicalItem.projectDetails) {
    return {
      ...historicalItem.projectDetails,
      semester: historicalItem.projectDetails.semester || historicalItem.semester,
    };
  }

  return {
    id: `proj-hist-${historicalItem.id}`,
    eventId: historicalItem.eventId ?? historicalItem.id,
    eventName: historicalItem.eventName,
    semester: historicalItem.semester,
    projectCode: `HIST-${historicalItem.semester.replace('-', '')}-${String(historicalItem.id).slice(-3).toUpperCase()}`,
    name: historicalItem.projectName,
    title: historicalItem.projectName,
    description: `Proyecto de investigación y desarrollo presentado en la ${historicalItem.eventName} para la asignatura ${historicalItem.courseName} (${historicalItem.semester}). Calificación oficial obtenida: ${(historicalItem.finalScore ?? 4.5).toFixed(2)} / 5.00.${historicalItem.award ? ` Reconocimiento otorgado: ${historicalItem.award}.` : ''}`,
    categoryName: historicalItem.courseName,
    enrollmentStatus: 'APPROVED' as const,
    canEdit: false,
    documents: [
      {
        id: `doc-${historicalItem.id}-poster`,
        type: 'POSTER' as const,
        title: `Póster Académico Oficial - ${historicalItem.projectName} (PDF)`,
        url: historicalItem.certificates?.[0]?.downloadUrl || 'https://example.com/poster-historico.pdf',
        createdAt: 1732000000000,
      },
      {
        id: `doc-${historicalItem.id}-memoria`,
        type: 'DOCUMENT' as const,
        title: `Memoria Técnica y Entregables de ${historicalItem.courseName}`,
        url: 'https://example.com/memoria-tecnica.pdf',
        createdAt: 1732000000000,
      },
    ],
    participants: [
      {
        id: `part-${profile.id}`,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        studentCode: profile.studentCode,
        career: profile.career,
        semester: Math.max(1, (profile.semester || 8) - 1),
        role: 'Líder',
        status: 'joined',
      },
    ],
  };
};

const createHistoricalEvaluationFromTrajectory = (
  historicalItem: any
) => {
  if (historicalItem.evaluation) {
    return historicalItem.evaluation;
  }

  const score = historicalItem.finalScore ?? 4.5;
  const isWinner = Boolean(
    historicalItem.award?.includes('1') ||
    historicalItem.award?.includes('Ganador') ||
    historicalItem.award?.includes('Honor')
  );
  const isCoWinner = Boolean(historicalItem.award?.includes('Coganador'));

  return {
    resultsPublished: true,
    finalScore: score,
    maxScore: 5.0,
    ranking: {
      position: isWinner ? 1 : 2,
      isWinner,
      isCoWinner,
      categoryName: historicalItem.courseName,
      awardTitle: historicalItem.award || 'Participación Destacada',
    },
    criteriaScores: [
      {
        id: `crit-${historicalItem.id}-1`,
        criterion: 'Innovación Tecnológica y Rigor Metodológico',
        component: 'Técnico',
        score: Math.min(5.0, Number((score + 0.1).toFixed(1))),
        maxScore: 5.0,
      },
      {
        id: `crit-${historicalItem.id}-2`,
        criterion: 'Impacto Social y Solución de Problema',
        component: 'Aplicabilidad',
        score: Math.max(3.8, Number((score - 0.1).toFixed(1))),
        maxScore: 5.0,
      },
      {
        id: `crit-${historicalItem.id}-3`,
        criterion: 'Sustentación Oral y Claridad de Entregables',
        component: 'Comunicación',
        score: score,
        maxScore: 5.0,
      },
    ],
    consolidatedFeedback: `Evaluación consolidada oficial de ${historicalItem.eventName} (Semestre ${historicalItem.semester}). Proyecto con excelente desempeño académico en la asignatura ${historicalItem.courseName}.`,
  };
};

export const getStudentDashboardDataByEmail = (
  email?: string,
  eventId?: number | string,
): StudentDashboardData => {
  const baseData = email
    ? studentMockScenariosByEmail[email.toLowerCase()] ?? scenarioPublishedRegular
    : scenarioPublishedRegular;

  // Si no se pide un eventId específico o coincide con el proyecto activo (3 o current), retorna el proyecto activo
  if (
    !eventId ||
    String(eventId) === 'current' ||
    String(baseData.currentProject?.eventId) === String(eventId)
  ) {
    return baseData;
  }

  const strEventId = String(eventId);

  // Buscar en la trayectoria histórica si coincide el eventId o el id del ítem
  const historicalItem =
    baseData.trajectory.find((item) => {
      if (item.isCurrent) return false;
      return (
        String(item.eventId) === strEventId ||
        item.id === strEventId ||
        strEventId.includes(item.id) ||
        (strEventId === '2' && item.semester.includes('2025-2')) ||
        (strEventId === '4' && item.semester.includes('2025-1')) ||
        (strEventId === '5' && item.semester.includes('2024'))
      );
    }) ?? baseData.trajectory.find((item) => !item.isCurrent); // Fallback: si no es el evento activo, toma el proyecto histórico disponible

  if (historicalItem) {
    return {
      ...baseData,
      currentProject: createHistoricalProjectFromTrajectory(historicalItem, baseData.profile),
      evaluation: createHistoricalEvaluationFromTrajectory(historicalItem),
    };
  }

  return baseData;
};

