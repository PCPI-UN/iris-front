"use client";

import dayjs from "dayjs";
import "dayjs/locale/es";

import { AdminSummaryCard } from "./admin-summary-card";
import { PendingInvitationsBanner } from "./pending-invitations-banner";
import { TeachingSummaryCard } from "./teaching-summary-card";

import {
  CurrentEventsSection,
  PastEventsSection,
} from "@/features/events/components/me-events-section";
import { useUser } from "@/lib/auth";
import { canViewAdministration } from "@/lib/authorization";
import { useAcademicProfiles } from "@/features/academic/api/get-academic-profiles";
import { teachingProfilesOf } from "@/features/academic/utils/academic-profiles";

/**
 * Panel for everyone: it does not label who the person is, it shows what they
 * have. Administration appears with `read:events` (decided by permission, not
 * by role name; the dean sees it read-only), then the events where they hold a
 * role, one link per role, and the history. Each academic profile of the
 * session (professor, tutor; GET /academic/profiles) has its own entry. Those entries and the events
 * share one grid of square tiles; pending invitations go first, as a notice.
 */
export const DashboardInfo = () => {
  const user = useUser();
  const profilesQuery = useAcademicProfiles();

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
        leading={[
          canViewAdministration(user.data) && <AdminSummaryCard key="admin" />,
          ...teachingProfilesOf(profilesQuery.data).map((profile) => (
            <TeachingSummaryCard key={profile} profile={profile} />
          )),
        ]}
      />
      <PastEventsSection />
    </div>
  );
};
