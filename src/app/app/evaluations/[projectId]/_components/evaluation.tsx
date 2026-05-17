import { ProjectEvaluationView } from '@/features/jury/components/project-evaluation-view';

const Evaluation = ({ projectId }: { projectId: string }) => {

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold">Evaluación</h1>
                <p className="text-sm md:text-base text-muted-foreground">
                    Evalúa según los criterios establecidos
                </p>
            </div>
            <ProjectEvaluationView projectId={projectId} />
        </div>
    );
};

export default Evaluation;
