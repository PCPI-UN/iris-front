"use client";

import { useUser } from "@/lib/auth";
import { canViewAdministration } from "@/lib/authorization";
import { StudentGeneralDashboardView } from "@/features/student-dashboard";

import { AdminDashboard } from "./admin-dashboard";

export const DashboardInfo = () => {
  const user = useUser();

  // Decides by permission, not by role name: every role that reads events
  // (admin, faculty admin, dean, event manager...) gets the administration
  // dashboard, whose GET /dashboard/stats requires read:events.
  if (canViewAdministration(user.data)) {
    return <AdminDashboard />;
  }

  // Everyone else (students, and roles that are still like User: professor,
  // tutor, department director) gets their own dashboard with their events
  return <StudentGeneralDashboardView />;
};
