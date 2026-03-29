// This file defines shared and derived request shapes for event write operations.
// BaseEvent avoids repeating the same properties across POST/PATCH DTOs.
export type EventStatus = "open" | "closed";

export interface BaseEvent {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  inscriptionDeadline?: string;
  evaluationsStatus?: EventStatus; // Default: closed
  isPublic?: boolean; // Default: true
}

export type CreateEventBody = BaseEvent;
export type UpdateEventBody = Partial<BaseEvent>;
