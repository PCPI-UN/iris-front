import { useQuery, queryOptions } from '@tanstack/react-query';
import { useUser } from '@/lib/auth';
import { StudentDashboardData } from '../types';
import { getStudentDashboardDataByEmail } from '../testing/fixtures';

export const getStudentDashboardData = async (
  userEmail?: string,
  eventId?: number | string,
): Promise<StudentDashboardData> => {
  // En fase mock / local, resuelve deterministamente según el correo del usuario autenticado y el evento
  return getStudentDashboardDataByEmail(userEmail, eventId);
};

export const getStudentDashboardQueryOptions = (
  userEmail?: string,
  eventId?: number | string,
) => {
  return queryOptions({
    queryKey: [
      'student-dashboard',
      userEmail || 'default',
      eventId !== undefined ? String(eventId) : 'current',
    ],
    queryFn: () => getStudentDashboardData(userEmail, eventId),
  });
};

export const useStudentDashboard = (eventId?: number | string) => {
  const { data: user, isLoading: isUserLoading } = useUser();
  const query = useQuery(getStudentDashboardQueryOptions(user?.email, eventId));

  return {
    ...query,
    isLoading: isUserLoading || query.isLoading,
  };
};

