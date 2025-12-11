/**
 * Landing Page Content
 * Archivo centralizado para gestionar todo el contenido de texto de la landing page
 */

export const landingContent = {
  // Navbar
  navbar: {
    brand: 'iris',
    links: {
      engineering: 'Ingenierías',
      events: 'Eventos',
      information: 'Información',
      winners: 'Ganadores',
    },
    cta: 'Iniciar sesión',
  },

  // Hero Section
  hero: {
    badge: 'Universidad del Norte • 2025',
    title: 'IRIS',
    subtitle: 'La plataforma que ilumina la excelencia en proyectos de ingeniería',
    stats: [
      { value: '300+', label: 'Proyectos' },
      { value: '7', label: 'Ingenierías' },
      { value: '500+', label: 'Estudiantes' },
    ],
    scrollIndicator: 'Scroll para descubrir',
  },

  // Story Sections
  story: {
    section1: {
      layers: [
        {
          title: 'En cada proyecto',
          subtitle: 'hay una historia por contar',
        },
        {
          title: 'En cada idea',
          subtitle: 'hay innovación esperando brillar',
        },
        {
          title: 'Iris ilumina el camino',
          subtitle: 'para que tu trabajo destaque',
          highlighted: true,
        },
      ],
    },
    section3: {
      words: ['Siete', 'ingenierías.', 'Un', 'solo', 'propósito:', 'Innovar.'],
      highlightedIndices: [0, 4, 5], // Índices de palabras con colores especiales
    },
  },

  // Horizontal Scroll Section
  horizontalScroll: {
    panels: [
      {
        badge: '01 • VISIÓN',
        title: 'Ver más allá',
        titleLine2: 'de lo',
        titleHighlight: 'evidente',
        description: 'es atreverse a imaginar, cuestionar y crear. En Uninorte formamos ingenieros que no se conforman con lo que existe.',
      },
      {
        badge: '02 • FORMACIÓN',
        title: 'Formamos profesionales con',
        titleHighlight: 'excelencia',
        description: 'estudiantes con formación práctica, visión global y excelencia en cada paso del camino.',
      },
      {
        badge: '03 • RECORRIDO',
        title: 'Ediciones que van dejando',
        titleHighlight: ' huella',
        description: 'cada edición de nuestra feria ha mostrado visión global, liderazgo y excelencia. Conoce cómo hemos impulsado generaciones que transforman la sociedad desde la innovación.',
        cta: 'Conoce ediciones anteriores',
      },
    ],
  },

  // Engineering Section
  engineering: {
    badge: '7 Especialidades',
    title: 'Ingenierías',
    titleHighlight: 'Involucradas',
    maskText: 'Una plataforma diseñada para destacar la excelencia en cada disciplina de ingeniería',
    maskTextHighlight: 'destacar la excelencia',
  },

  // Events Section
  events: {
    badge: 'Eventos Disponibles',
    title: 'Próximos',
    titleHighlight: 'Eventos',
    subtitle: 'Regístrate en los eventos y participa en las ferias de proyectos finales',
    cta: {
      open: 'Inscribirse',
      default: 'Más información',
    },
    status: {
      upcoming: 'Inscripciones Abiertas',
      closed: 'Finalizado',
    },
    location: 'Coliseo Los Fundadores, Universidad del Norte',
  },

  // Developers Carousel
  developers: {
    badge: 'Universidad del Norte',
    title: 'Equipo de',
    titleHighlight: 'Desarrollo',
    team: [
      { name: 'Juan Povea', role: 'Backend Leader' },
      { name: 'Jorge Sánchez', role: 'Frontend Leader' },
      { name: 'Alejandra Valencia', role: 'Backend Developer' },
      { name: 'Carlos López', role: ' UI/UX Leader - Frontend Developer' },
      { name: 'Yovany Zhu Ye', role: 'Full Stack Developer' },
      { name: 'Jhonatan Romero', role: 'Frontend Developer' },
      { name: 'Jesús Cantillo', role: 'Backend Developer' },
      { name: 'Juan Carrasquilla', role: 'Backend Developer' },
      { name: 'Samuel Robles', role: 'Backend Developer' },
      { name: 'Gabriel Palencia', role: 'Backend Developer' },
      { name: 'Daniel Romero', role: 'Software Architect' },
    ],
  },

  // Footer
  footer: {
    brand: 'iris',
    description: 'Plataforma de evaluación de proyectos finales de ingeniería. Universidad del Norte, Barranquilla.',
    navigation: {
      title: 'Navegación',
      links: [
        { label: 'Ingenierías', href: '#ingenierias' },
        { label: 'Eventos', href: '#eventos' },
      ],
    },
    // contact: {
    //   title: 'Contacto',
    //   links: [
    //     { label: 'Email', href: '#' },
    //     { label: 'Soporte', href: '#' },
    //     { label: 'Documentación', href: '#' },
    //   ],
    // },
    copyright: '© 2025 Iris. Proyecto Final de Ingeniería - Universidad del Norte.',
    // legal: [
    //   { label: 'Privacidad', href: '#' },
    //   { label: 'Términos', href: '#' },
    // ],
  },
};

// Tipo TypeScript para el contenido (opcional pero recomendado)
export type LandingContent = typeof landingContent;
