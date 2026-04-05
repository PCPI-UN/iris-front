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
    register: {
      getHref: (redirectTo?: string | null | undefined) =>
        `/auth/register${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}`,
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
    juries: {
      getHref: () => "/app/juries",
    },
    administrators: {
      getHref: () => "/app/administrators",
    },
    courses: {
      getHref: () => "/app/courses",
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
      getHref: (eventId: string | number) => `/public/projects/${eventId}`,
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
      getHref: () => '/public/developers',
    },
  },
} as const;
