"use client";

import dayjs from "dayjs";
import "dayjs/locale/es";

import { AdminSummaryCard } from "./admin-summary-card";
import { PendingInvitationsBanner } from "./pending-invitations-banner";

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
 * role, one link per role, and the history. Administration and the events
 * share one grid of square tiles; pending invitations go first, as a notice.
 */
export const DashboardInfo = () => {
  const user = useUser();

  return (
    <div className="dashboard-page max-w-6xl space-y-7 pb-12">
      <header>
        <p className="text-sm text-slate-400 first-letter:uppercase">
          {dayjs().locale("es").format("dddd, D [de] MMMM")}
        </p>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Hola, {user.data?.firstName}
        </h1>
      </header>
      <PendingInvitationsBanner />
      <CurrentEventsSection
        leading={
          canViewAdministration(user.data) ? <AdminSummaryCard /> : undefined
        }
      />
      <PastEventsSection />
    </div>
  );
};
