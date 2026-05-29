import {
  randCompanyName,
  randUserName,
  randEmail,
  randParagraph,
  randUuid,
  randPassword,
  randCatchPhrase,
} from "@ngneat/falso";

const generateUser = () => ({
  id: randUuid() + Math.random(),
  firstName: randUserName({ withAccents: false }),
  lastName: randUserName({ withAccents: false }),
  email: randEmail(),
  password: randPassword(),
  teamId: randUuid(),
  teamName: randCompanyName(),
  role: "ADMIN",
  bio: randParagraph(),
  createdAt: Date.now(),
});

export const createUser = <T extends Partial<ReturnType<typeof generateUser>>>(
  overrides?: T
) => {
  return { ...generateUser(), ...overrides };
};

const generateTeam = () => ({
  id: randUuid(),
  name: randCompanyName(),
  description: randParagraph(),
  createdAt: Date.now(),
});

export const createTeam = <T extends Partial<ReturnType<typeof generateTeam>>>(
  overrides?: T
) => {
  return { ...generateTeam(), ...overrides };
};

const generateDiscussion = () => ({
  id: randUuid(),
  title: randCatchPhrase(),
  body: randParagraph(),
  createdAt: Date.now(),
  public: true,
});

export const createDiscussion = <
  T extends Partial<ReturnType<typeof generateDiscussion>>,
>(
  overrides?: T & {
    authorId?: string;
    teamId?: string;
  }
) => {
  return { ...generateDiscussion(), ...overrides };
};

const generateComment = () => ({
  id: randUuid(),
  body: randParagraph(),
  createdAt: Date.now(),
});

export const createComment = <
  T extends Partial<ReturnType<typeof generateComment>>,
>(
  overrides?: T & {
    authorId?: string;
    discussionId?: string;
  }
) => {
  return { ...generateComment(), ...overrides };
};

const generateEvent = () => ({
  id: randUuid(),
  name: randCatchPhrase(),
  description: randParagraph(),
  startDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  endDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  inscriptionDeadline: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  accessCode: `EVT${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
  isPubliclyJoinable: Math.random() > 0.5,
  evaluationsOpened: Math.random() > 0.5,
  location: randCompanyName(),
  locationDetails: randParagraph(),
  latitude: Math.random() * 180 - 90,
  longitude: Math.random() * 360 - 180,
  eventType: Math.random() > 0.5 ? 2 : 1,
  evaluationType: Math.random() > 0.5 ? 2 : 1,
  inscriptionRequirements: randParagraph(),
  inscriptionCost: Math.floor(Math.random() * 1000),
  minimumTeamSize: Math.floor(Math.random() * 5) + 1,
  specificInscriptionDetails: [],
  aboutOurAllies: randParagraph(),
  organizers: [],
  collaborators: [],
  awards: [],
  active: true,
  createdAt: Date.now(),
});

export const createEvent = <
  T extends Partial<ReturnType<typeof generateEvent>>,
>(
  overrides?: T
) => {
  return { ...generateEvent(), ...overrides };
};

const generateProject = () => ({
  id: randUuid(),
  title: randCatchPhrase(),
  description: randParagraph(),
  eventId: randUuid(),
  teamMembers: Array.from(
    { length: Math.floor(Math.random() * 5) + 1 },
    () => ({
      name: randUserName({ withAccents: false }),
      photoUrl: `https://randomuser.me/api/portraits/lego/${Math.floor(Math.random() * 10)}.jpg`,
    })
  ),
  documentsAttached: Math.floor(Math.random() * 10),
  submittedAt:
    Math.random() > 0.5
      ? Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
      : null,
  approvedAt:
    Math.random() > 0.5
      ? Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000
      : null,
  createdAt: Date.now(),
});

export const createProject = <
  T extends Partial<ReturnType<typeof generateProject>>,
>(
  overrides?: T
) => {
  return { ...generateProject(), ...overrides };
};
