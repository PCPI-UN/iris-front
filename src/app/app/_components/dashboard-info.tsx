"use client";

import { AdminSummaryCard } from "./admin-summary-card";

import {
  CurrentEventsSection,
  PastEventsSection,
} from "@/features/events/components/me-events-section";
import { useUser } from "@/lib/auth";
import { canViewAdministration } from "@/lib/authorization";

/**
 * Panel for everyone: it does not label who the person is, it shows what they
 * have. Administration appears with `read:events` (decided by permission, not
 * by role name; the dean sees it read-only), then the events where they hold a
 * role, one link per role, and the history.
 */
export const DashboardInfo = () => {
  const user = useUser();

  return (
    <div className="dashboard-page max-w-3xl space-y-7 pb-12">
      <h1 className="text-2xl font-bold md:text-3xl">
        Hola, {user.data?.firstName}
      </h1>
      {canViewAdministration(user.data) && <AdminSummaryCard />}
      <CurrentEventsSection />
      <PastEventsSection />
    </div>
  );
};
