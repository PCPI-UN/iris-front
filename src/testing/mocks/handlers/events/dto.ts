// This file defines the shape of the data used to create or update an event. (POST/PATCH)
// Optional fields allow partial updates and default handling in handlers.
export type EventBody = {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  inscriptionDeadline?: string;
  evaluationsStatus?: "open" | "closed"; // Default: closed
  isPublic?: boolean; // Default: true
};
