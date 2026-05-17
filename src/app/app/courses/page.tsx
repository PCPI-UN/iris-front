import { redirect } from "next/navigation";

import { paths } from "@/config/paths";

const LegacyCategoriesRedirectPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ page: string | null; event: string | null }>;
}) => {
  const resolvedSearchParams = await searchParams;
  const query = new URLSearchParams();

  if (resolvedSearchParams.page) {
    query.set("page", resolvedSearchParams.page);
  }

  if (resolvedSearchParams.event) {
    query.set("event", resolvedSearchParams.event);
  }

  const destination = query.toString()
    ? `${paths.app.categories.getHref()}?${query.toString()}`
    : paths.app.categories.getHref();

  redirect(destination);
};

export default LegacyCategoriesRedirectPage;
