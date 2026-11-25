import { TeachingProfileGate } from "../../_components/teaching-profile-gate";
import { TeachingProjectDetail } from "../../_components/teaching-project-detail";

export const metadata = {
  title: "Proyecto",
  description: "Detalle académico del proyecto",
};

const TeachingProjectPage = async ({
  params,
}: {
  params: Promise<{ profile: string; projectId: string }>;
}) => {
  const { profile, projectId } = await params;

  return (
    <TeachingProfileGate profileSlug={profile}>
      <TeachingProjectDetail
        profileSlug={profile}
        projectId={Number(projectId)}
      />
    </TeachingProfileGate>
  );
};

export default TeachingProjectPage;
