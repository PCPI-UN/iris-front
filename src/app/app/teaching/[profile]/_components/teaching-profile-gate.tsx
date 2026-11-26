"use client";

import type { ReactNode } from "react";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAcademicProfiles } from "@/features/academic/api/get-academic-profiles";
import { teachingProfileFromSlug } from "@/features/academic/utils/academic-profiles";
import { Button } from "@/components/ui/button";
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
    // Only a successful answer without the profile sends the user away; a failure offers a retry
    if (profilesQuery.isSuccess && !allowed) {
      router.replace(paths.app.root.getHref());
    }
  }, [profilesQuery.isSuccess, allowed, router]);

  if (profilesQuery.isError) {
    return (
      <div className="rounded-3xl border border-white/10 bg-[#0e101a]/70 p-6 text-center backdrop-blur-xl">
        <p className="text-sm text-slate-300">
          No se pudieron cargar tus perfiles académicos.
        </p>
        <Button
          className="mt-3 min-h-[44px]"
          variant="flat"
          onPress={() => void profilesQuery.refetch()}
        >
          Reintentar
        </Button>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
};
