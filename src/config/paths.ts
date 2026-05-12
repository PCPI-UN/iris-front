// Route paths with optional role metadata for authorization-aware navigation
// Roles are defined in src/types/api.ts as: "ADMIN" | "USER"
// Note: STUDENT and JURY are event-specific subroles, not main user roles

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const paths = {
  home: {
    getHref: () => "/",
  },

  auth: {
    signup: {
      getHref: (redirectTo?: string | null | undefined) =>
        `/auth/signup${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}`,
    },
    signup_sent: {
      getHref: () => '/auth/signup/sent',
    },
    login: {
      getHref: (redirectTo?: string | null | undefined) =>
        `/auth/login${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}`,
    },
    forgot_password: {
      getHref: (redirectTo?: string | null | undefined) =>
        `/auth/fg-password${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}`,
    },
    change_password: {
      getHref: (token: string) =>
        `/auth/chg-password?token=${encodeURIComponent(token)}`,
    },
    confirm: {
      getHref: (token: string) =>
        `/auth/confirm?token=${encodeURIComponent(token)}`,
    },
  },

  app: {
    root: {
      getHref: () => "/app",
      roles: ["Admin", "User"],
    },
    dashboard: {
      getHref: () => "/app",
      roles: ["Admin", "User"],
    },
    discussions: {
      getHref: () => "/app/discussions",
      roles: ["Admin"],
    },
    discussion: {
      getHref: (id: string) => `/app/discussions/${id}`,
      roles: ["Admin"],
    },
    profile: {
      getHref: () => "/app/profile",
      roles: ["Admin", "User"],
    },
    invitations: {
      getHref: () => "/app/invitations",
      roles: ["User"],
    },
    events: {
      getHref: () => "/app/events",
      roles: ["Admin"],
    },
    event: {
      getHref: (id: string) => `/app/events/${id}`,
      roles: ["Admin"],
    },
    projects: {
      getHref: () => "/app/projects",
      roles: ["Admin"],
    },
    monitoring: {
      getHref: () => "/app/monitoreo",
      roles: ["Admin"],
    },
    juries: {
      getHref: () => "/app/juries",
    },
    assignments: {
      getHref: () => "/app/assignments"
    },
    administrators: {
      getHref: () => "/app/administrators",
    },
    courses: {
      getHref: () => "/app/courses",
      roles: ["Admin"],
    },
    categories: {
      getHref: () => "/app/categories",
      roles: ["Admin"],
    },
    project_jury: {
      getHref: (id: string) => `/app/events/${id}`,
      roles: ["User"], // Requires subrole JURY in the specific event
    },
    evaluations: {
      getHref: (id: string) => `/app/evaluations/${id}`,
      roles: ["User"], // Requires subrole JURY in the specific event
    },
    criteria: {
      getHref: () => "/app/criteria",
    },
  },
  public: {
    discussion: {
      getHref: (id: string) => `/public/discussions/${id}`,
    },
    project: {
      getHref: (
        event:
          | string
          | number
          | { id: string | number; name?: string | null | undefined },
      ) => {
        if (typeof event === 'object') {
          const projectSlug = event.name ? slugify(event.name) : '';
          return projectSlug
            ? `/public/projects/${projectSlug}-${String(event.id)}`
            : `/public/projects/${String(event.id)}`;
        }

        return `/public/projects/${String(event)}`;
      },
    },
    event: {
      getHref: (
        eventId?:
          | string
          | number
          | { id: string | number; name?: string | null | undefined },
      ) => {
        if (!eventId) {
          return '/public/events';
        }

        if (typeof eventId === 'object') {
          const eventSlug = eventId.name ? slugify(eventId.name) : '';
          return eventSlug
            ? `/public/events/${eventSlug}-${String(eventId.id)}`
            : `/public/events/${String(eventId.id)}`;
        }

        return `/public/events/${String(eventId)}`;
      },
    },
    developers: {
      getHref: () => '/public/contributors',
    },
  },
} as const;
