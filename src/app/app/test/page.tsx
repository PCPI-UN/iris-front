import { ProjectEvaluationView } from "@/components/test/test";

export default function TestPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">Evaluación de Proyecto</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Evalúa el proyecto según los criterios establecidos
        </p>
      </div>
      <ProjectEvaluationView />
    </div>
  );
}