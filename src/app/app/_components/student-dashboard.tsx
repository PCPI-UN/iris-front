"use client";

import { StudentProjectDashboardView } from "@/features/student-dashboard";

export interface StudentDashboardProps {
  eventId?: number | string;
}

export const StudentDashboard = ({ eventId }: StudentDashboardProps) => {
  return <StudentProjectDashboardView eventId={eventId} />;
};
