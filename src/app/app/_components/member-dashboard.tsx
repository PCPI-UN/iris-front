"use client";

import { useMyEvents } from "@/features/events/api/get-my-events";
import {
  MY_EVENTS_PAGE_SIZE,
  MyEventsSection,
} from "@/features/events/components/my-events-section";
import {
  StudentGeneralDashboardView,
  useStudentDashboard,
} from "@/features/student-dashboard";

/**
 * Panel of a user without administrative permissions. The platform role does not
 * say what they do: that depends on their role in each event (juror or
 * participant), so the panel lists their events and each one opens the view of
 * that role. The project and history only show for someone who has a project;
 * a juror without one does not get an empty student panel.
 */
export const MemberDashboard = () => {
  const studentQuery = useStudentDashboard();
  // Same query as the first page of the section: shared cache, one request
  const eventsQuery = useMyEvents({ page: 1, limit: MY_EVENTS_PAGE_SIZE });

  const student = studentQuery.data;
  const hasProject = Boolean(
    student?.currentProject || (student?.trajectory?.length ?? 0) > 0,
  );
  const hasEvents = (eventsQuery.data?.meta?.total ?? 0) > 0;

  // Without events either, the student panel keeps explaining how to join one.
  // On error it shows its own retry.
  const showStudentPanel =
    !studentQuery.isLoading &&
    (studentQuery.isError ||
      hasProject ||
      (!eventsQuery.isLoading && !eventsQuery.isError && !hasEvents));

  return (
    <div className="dashboard-page space-y-7 pb-12">
      <MyEventsSection />
      {showStudentPanel && <StudentGeneralDashboardView />}
    </div>
  );
};
