"use client";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Profile as ProfileData,
  useProfile,
} from "@/features/users/api/get-profile";
import { UpdateProfile } from "@/features/users/components/update-profile";

const ROLE_LABELS: Record<string, string> = {
  Admin: "Administrador",
  Juror: "Jurado",
  Participant: "Participante",
};

const getInitials = ({ firstName, lastName, email }: ProfileData) =>
  `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() ||
  email[0]?.toUpperCase();

type SectionProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

const Section = ({ title, description, children }: SectionProps) => (
  <section className="glass-card overflow-hidden border border-border/30">
    <div className="px-4 py-5 sm:px-6">
      <h2 className="text-lg font-medium leading-6">{title}</h2>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        {description}
      </p>
    </div>
    <div className="border-t border-border/30 px-4 py-5 sm:px-6">
      {children}
    </div>
  </section>
);

type EntryProps = {
  label: string;
  value: string | null;
};

const Entry = ({ label, value }: EntryProps) => (
  <div>
    <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
    <dd className="mt-1 text-sm">{value || "Sin información"}</dd>
  </div>
);

const ProfileSkeleton = () => (
  <div className="dashboard-page space-y-4 md:space-y-6" aria-busy="true">
    <Skeleton className="h-24 rounded-xl" />
    <Skeleton className="h-80 rounded-xl" />
    <Skeleton className="h-40 rounded-xl" />
  </div>
);

export const Profile = () => {
  const profileQuery = useProfile();

  if (profileQuery.isLoading) return <ProfileSkeleton />;

  const profile = profileQuery.data;

  if (!profile) {
    return (
      <div className="dashboard-page">
        <div
          role="alert"
          className="glass-card flex flex-col items-start gap-3 border border-border/30 px-4 py-5 sm:px-6"
        >
          <p className="text-sm">
            No pudimos cargar tu perfil. Revisa tu conexión e intenta de nuevo.
          </p>
          <Button
            size="sm"
            variant="flat"
            isLoading={profileQuery.isFetching}
            onPress={() => profileQuery.refetch()}
          >
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  const fullName = `${profile.firstName} ${profile.lastName}`.trim();

  return (
    <div className="dashboard-page space-y-4 md:space-y-6">
      <div className="glass-card flex items-center gap-4 border border-border/30 px-4 py-5 sm:px-6">
        <Avatar
          name={fullName || profile.email}
          getInitials={() => getInitials(profile)}
          size="lg"
          color="primary"
        />
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold">
            {fullName || profile.email}
          </h1>
          <p className="truncate text-sm text-muted-foreground">
            {profile.email}
          </p>
          {profile.roles.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {profile.roles.map((role) => (
                <Chip key={role} size="sm" variant="flat">
                  {ROLE_LABELS[role] ?? role}
                </Chip>
              ))}
            </div>
          )}
        </div>
      </div>

      <Section
        title="Información personal"
        description="Actualiza tu nombre y tu teléfono de contacto."
      >
        <UpdateProfile profile={profile} />
      </Section>

      <Section
        title="Información académica"
        description="Se obtiene de tus inscripciones a proyectos, por eso no se puede editar aquí."
      >
        <dl className="grid gap-4 sm:grid-cols-3">
          <Entry
            label="Código estudiantil"
            value={profile.academic.studentCode}
          />
          <Entry label="Carrera" value={profile.academic.career} />
          <Entry label="Semestre" value={profile.academic.semester} />
        </dl>
      </Section>
    </div>
  );
};
