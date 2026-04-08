import { ProjectWizard } from "@/features/projects-public/components/project-wizard";

const Project = ({ eventId, eventType }: { eventId: number; eventType: "Competition" | "Exposition" }) => {

    return (
        <div className="container mx-auto max-w-4xl py-12">
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-bold text-foreground mb-3 text-balance">Registro de Proyectos</h1>
                <p className="text-muted-foreground text-lg text-pretty">
                    Complete el formulario para registrar su proyecto académico
                </p>
            </div>
            <ProjectWizard eventId={eventId} eventType={eventType} />
        </div>
    );
};

export default Project;
