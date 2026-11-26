import { Card } from "@/components/ui/card";

interface CriteriaEvaluationCardProps {
  title: string;
  score: number;
  maxScore: number;
}

export function CriteriaEvaluationCard({
  title,
  score,
  maxScore,
}: CriteriaEvaluationCardProps) {
  const percentage = Math.round((score / maxScore) * 100);

  return (
    <Card className="bg-content1 border-border p-6 text-card-foreground glass-card">
      <div className="flex items-start justify-between mb-8">
        <h3 className="text-base font-medium">{title}</h3>
        <p className="text-2xl font-bold">
          {score}/{maxScore}
        </p>
      </div>
      <p className="text-sm text-muted-foreground">
        {percentage}% del puntaje máximo
      </p>
    </Card>
  );
}
