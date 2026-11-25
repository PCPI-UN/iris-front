"use client";

import type { ReactNode } from "react";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAcademicProfiles } from "@/features/academic/api/get-academic-profiles";
import { teachingProfileFromSlug } from "@/features/academic/utils/academic-profiles";
import { Spinner } from "@/components/ui/spinner";
import { paths } from "@/config/paths";

/**
 * Opens the teaching screen only for a profile the session holds
 * (GET /academic/profiles); any other URL goes back to the home page.
 */
export const TeachingProfileGate = ({
  profileSlug,
  children,
}: {
  profileSlug: string;
  children: ReactNode;
}) => {
  const router = useRouter();
  const profilesQuery = useAcademicProfiles();
  const profile = teachingProfileFromSlug(profileSlug);
  const allowed = Boolean(profile && profilesQuery.data?.includes(profile));

  useEffect(() => {
    if (!profilesQuery.isLoading && !allowed) {
      router.replace(paths.app.root.getHref());
    }
  }, [profilesQuery.isLoading, allowed, router]);

  if (!allowed) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
};
