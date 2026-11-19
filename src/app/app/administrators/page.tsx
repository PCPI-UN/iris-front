import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import { Administrators } from "./_components/Administrators";

import { getAdministratorsQueryOptions } from "@/features/administrators/api/get-administrators";
import { RoleGuard } from "@/components/auth/role-guard";

export const metadata = {
  title: "Administradores",
  description: "Gestión de administradores",
};

const AdministratorsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ page: string | null }>;
}) => {
  const queryClient = new QueryClient();

  const resolvedSearchParams = await searchParams;

  await queryClient.prefetchQuery(
    getAdministratorsQueryOptions({
      page: resolvedSearchParams.page ? Number(resolvedSearchParams.page) : 1,
    }),
  );

  const dehydratedState = dehydrate(queryClient);

  return (
    <RoleGuard roles={["Admin"]}>
      <HydrationBoundary state={dehydratedState}>
        <Administrators />
      </HydrationBoundary>
    </RoleGuard>
  );
};

export default AdministratorsPage;
