/**
 * Landing Page Content
 */

import { contributors } from '@/features/developers/data/contributors';

export const landingContent = {
  // Navbar
  navbar: {
    brand: 'iris',
    links: {
      events: 'Eventos próximos',
      information: 'Información',
      pastEvents: 'Eventos pasados',
      developers: 'Contribuidores',
    },
    cta: 'Iniciar sesión',
  },

  // Hero Section
  hero: {
    badge: 'Universidad del Norte • 2026',
    title: 'IRIS',
    subtitle: 'Un espacio para descubrir, conectar y participar en eventos que hacen brillar tus ideas',
  
  stats: [
    { value: 'Explora', label: 'Ver Eventos y Convocatorias' },
    { value: 'Participa', label: 'Postúlate Ahora' },
    { value: 'Descubre', label: 'Ver Resultados y Logros' },
  ],
  
    scrollIndicator: 'Scroll para descubrir',
  },

  // Story Sections
  story: {
    section1: {
      layers: [
        {
          title: 'En cada evento',
          subtitle: 'surgen historias por contar',
        },
        {
          title: 'En cada idea',
          subtitle: 'hay innovación esperando brillar',
        },
        {
          title: 'Iris conecta todo',
          subtitle: 'para que todos los involucrados puedan vivir cada proceso con claridad y emoción',
          highlighted: true,
        },
      ],
    },
    section2: {
      words: ['Múltiples', 'eventos.', 'Distintas', 'miradas.', 'Un', 'mismo', 'espacio', 'para', 'innovar.'],
      highlightedIndices: [0, 3, 8], // Highlighted words indexes.
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
        description: 'es atreverse a imaginar, cuestionar y crear. En Iris conectamos innovación, evaluación y talento en una sola plataforma.',
      },
      {
        badge: '02 • FORMACIÓN',
        title: 'Impulsamos procesos con',
        titleHighlight: 'excelencia',
        description: 'facilitando la gestión de eventos, la participación de estudiantes y la evaluación por jurados en cada etapa del proceso.',
      },
      {
        badge: '03 • RECORRIDO',
        title: 'Eventos que van dejando',
        titleHighlight: ' huella',
        description: 'cada evento reúne ideas, esfuerzo y talento. Explora ediciones anteriores y descubre cómo continúan generando impacto.',
        cta: 'Ver eventos anteriores',
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
    badge: 'Eventos',
    title: 'Próximos',
    titleHighlight: 'Eventos',
    subtitle: 'Regístrate, participa o explora los eventos activos en la plataforma',
    maintenance: {
      title: '* Mantenimiento',
      message: 'Inscripciones volverán en unos momentos.',
    },
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
    team: contributors,
  },

  // Footer
  footer: {
    brand: 'iris',
    description: 'Plataforma para la Gestión y Exploración de Eventos de la Universidad del Norte.',
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
    copyright: '© 2026 Iris. Proyecto Final de Ingeniería - Universidad del Norte.',
    // legal: [
    //   { label: 'Privacidad', href: '#' },
    //   { label: 'Términos', href: '#' },
    // ],
  },
};

export type LandingContent = typeof landingContent;
