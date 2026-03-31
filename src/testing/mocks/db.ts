import { factory, primaryKey } from "@mswjs/data";
import { nanoid } from "nanoid";

const models = {
  user: {
    id: primaryKey(nanoid),
    firstName: String,
    lastName: String,
    email: String,
    password: String,
    teamId: String,
    role: String,
    bio: String,
    createdAt: Date.now,
  },
  team: {
    id: primaryKey(nanoid),
    name: String,
    description: String,
    createdAt: Date.now,
  },
  discussion: {
    id: primaryKey(nanoid),
    title: String,
    body: String,
    authorId: String,
    teamId: String,
    createdAt: Date.now,
    public: Boolean,
  },
  comment: {
    id: primaryKey(nanoid),
    body: String,
    authorId: String,
    discussionId: String,
    createdAt: Date.now,
  },
  event: {
    id: primaryKey(nanoid),
    name: String,
    description: String,
    startDate: String,
    endDate: String,
    inscriptionDeadline: String,
    accessCode: String,
    isPubliclyJoinable: Boolean,
    evaluationsOpened: Boolean,
    statusName: String,
    location: String,
    locationDetails: String,
    eventType: String,
    inscriptionCost: Number,
    inscriptionRequirements: String,
    aboutOurAllies: String,
    evaluationType: String,
    minimumTeamSize: Number,
    specificInscriptionDetails: Array,
    categories: Array,
    organizers: Array,
    collaborators: Array,
    awards: Array,
    status: Number,
    active: Boolean,
    role: String,
    createdAt: Date.now,
    updatedAt: Date.now,
  },
  eventMembership: {
    id: primaryKey(nanoid),
    eventId: String,
    userId: String,
    eventRole: String,
    createdAt: Date.now,
  },
  evaluation: {
    id: primaryKey(nanoid),
    projectId: String,
    memberUserId: String,
    grade: Number,
    comments: String,
    scores: Array,
    createdAt: Date.now,
  },
  evaluationDetail: {
    id: primaryKey(nanoid),
    evaluationId: String,
    criterion: String,
    score: Number,
  },
  project: {
    id: primaryKey(nanoid),
    eventId: String,
    courseId: String,
    name: String,
    logo: String,
    description: String,
    eventNumber: String,
    state: String,
    documents: Array,
    participants: Array,
    jurorAssignments: Array,
    createdAt: Date.now,
  },
  course: {
    id: primaryKey(nanoid),
    eventId: String,
    code: String,
    description: String,
    active: Boolean,
  },
  criterion: {
    id: primaryKey(nanoid),
    eventId: String,
    name: String,
    description: String,
    weight: Number,
    criterionCourse: Array,
  },
  jury: {
    id: primaryKey(nanoid),
    email: String,
    invitationStatus: String,
    eventIds: Array,
    projectIds: Array,
    createdAt: Date.now,
  },
  administrator: {
    id: primaryKey(nanoid),
    email: String,
    invitationStatus: String,
    createdAt: Date.now,
  },
};

export const db = factory(models);

export type Model = keyof typeof models;

const dbFilePath = "mocked-db.json";

export const loadDb = async () => {
  // If we are running in a Node.js environment
  if (typeof window === "undefined") {
    const { readFile, writeFile } = await import("fs/promises");
    try {
      const data = await readFile(dbFilePath, "utf8");
      return JSON.parse(data);
    } catch (error: any) {
      if (error?.code === "ENOENT") {
        const emptyDB = {};
        await writeFile(dbFilePath, JSON.stringify(emptyDB, null, 2));
        return emptyDB;
      } else {
        console.error("Error loading mocked DB:", error);
        return null;
      }
    }
  }
  // If we are running in a browser environment
  return Object.assign(
    JSON.parse(window.localStorage.getItem("msw-db") || "{}")
  );
};

export const storeDb = async (data: string) => {
  // If we are running in a Node.js environment
  if (typeof window === "undefined") {
    const { writeFile } = await import("fs/promises");
    await writeFile(dbFilePath, data);
  } else {
    // If we are running in a browser environment
    window.localStorage.setItem("msw-db", data);
  }
};

export const persistDb = async (model: Model) => {
  if (process.env.NODE_ENV === "test") return;
  const data = await loadDb();
  data[model] = db[model].getAll();
  await storeDb(JSON.stringify(data));
};

export const initializeDb = async () => {
  const database = await loadDb();
  Object.entries(db).forEach(([key, model]) => {
    const dataEntres = database[key];
    if (dataEntres) {
      dataEntres?.forEach((entry: Record<string, any>) => {
        model.create(entry);
      });
    }
  });
};

export const resetDb = () => {
  window.localStorage.clear();
};
