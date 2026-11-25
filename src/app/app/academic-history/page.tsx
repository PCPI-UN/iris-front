import { StudentGeneralDashboardView } from "@/features/student-dashboard";

export const metadata = {
  title: "Mi trayectoria académica",
  description:
    "Tu proyecto activo, tus participaciones anteriores con su calificación y tus premios",
};

/**
 * Dashboard académico del estudiante (IRIS-V3-STD-01): proyecto activo y
 * trayectoria con la calificación de cada evento. La ficha y los resultados de
 * cada evento se abren desde aquí en /app/events/:eventId/dashboard.
 */
const AcademicHistoryPage = () => {
  return <StudentGeneralDashboardView />;
};

export default AcademicHistoryPage;
