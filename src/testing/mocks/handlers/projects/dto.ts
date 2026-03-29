// Data structure for POST/PATCH requests to create or update a project.
export type ProjectBody = {
  eventId: string;
  courseId: string;
  name: string;
  logo: string;
  description?: string;
  eventNumber?: string;
  state?: string;
  documents?: Array<{ type: string; url: string }>;
  participants?: Array<{
    firstName: string;
    lastName: string;
    email: string;
    studentCode?: string;
  }>;
  jurorAssignments?: Array<{
    memberUserId: string;
  }>;
};
