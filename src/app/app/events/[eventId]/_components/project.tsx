import { ContentLayout } from "@/components/layouts/content-layout";
import { ProjectListView } from "@/features/jury/components/project-list-view";

const Project = ({ eventId }: { eventId: string }) => {

    return (
        <div className='space-y-6'>
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">
                    Evaluacion de proyectos
                </h1>
                <p className="text-muted-foreground">
                    En esta sección podrás evaluar los proyectos presentados en el evento. Revisa cada proyecto, asigna puntuaciones y proporciona retroalimentación constructiva para ayudar a los participantes a mejorar sus ideas y presentaciones.
                </p>
            </div>
            <ProjectListView eventId={eventId} />
        </div>
    );
};

export default Project;
