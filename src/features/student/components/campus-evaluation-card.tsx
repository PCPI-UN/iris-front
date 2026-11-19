import { Badge } from "@heroui/badge"
import { Card } from "@/components/ui/card"
import { Award } from "lucide-react"

interface CampusEvaluationCardProps {
    title?: string
    description?: string
    overallScore?: number
    maxScore?: number
    evaluationsCount?: number
    isEvaluated?: boolean
}

export function CampusEvaluationCard({
    title = "Smart Campus Navigation System",
    description = "An AI-powered mobile app for indoor navigation across campus buildings",
    overallScore = 4.8,
    maxScore = 5.0,
    evaluationsCount = 4,
    isEvaluated = true,
}: CampusEvaluationCardProps) {
    return (
        <Card className="bg-content1 border-border p-6 text-card-foreground glass-card">
            <div className="flex items-start justify-between mb-8">
                <div className="flex-1">
                    <h2 className="text-lg font-semibold mb-1">{title}</h2>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                {isEvaluated && (
                    <div className='flex items-center gap-1'>
                        <Badge variant="shadow" className="flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5" />
                        </Badge>
                        <p className='text-xs'>Evaluado</p>
                    </div>
                )}
            </div>

            <div className="flex items-end justify-between">
                <div>
                    <p className="text-xs text-muted-foreground mb-1">Puntaje general</p>
                    <p className="text-4xl font-bold">
                        {overallScore}
                        <span className="text-muted-foreground">/{maxScore}</span>
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-1">Evaluaciones recibidas</p>
                    <p className="text-4xl font-bold">{evaluationsCount}</p>
                </div>
            </div>
        </Card>
    )
}
