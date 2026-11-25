import { TeachingProfileGate } from "./_components/teaching-profile-gate";
import { TeachingView } from "./_components/teaching-view";

export const metadata = {
  title: "Proyectos académicos",
  description: "Proyectos de los cursos o tutorías",
};

const TeachingPage = async ({
  params,
}: {
  params: Promise<{ profile: string }>;
}) => {
  const { profile } = await params;

  return (
    <TeachingProfileGate profileSlug={profile}>
      <TeachingView profileSlug={profile} />
    </TeachingProfileGate>
  );
};

export default TeachingPage;
