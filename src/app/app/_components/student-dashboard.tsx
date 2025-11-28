'use client';

import { useUser } from '@/lib/auth';
import { EvaluationProject } from '@/features/evaluations/components/get-evaluation-project';
import { useUserProjects } from '@/features/projects/api/get-user-projects';
import { Button } from '@heroui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/spinner';
import '@/features/landing/index.css';

type StudentDashboardProps = {
    eventId?: string;
};

export const StudentDashboard = ({ eventId }: StudentDashboardProps = {}) => {
    const user = useUser();
    const router = useRouter();
    
    return (
        <div className='dashboard-page space-y-4 md:space-y-6'>
            <div className="space-y-1 md:space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold">
                    Welcome back, {`${user.data?.firstName} ${user.data?.lastName}`}
                </h1>
                <p className="text-sm md:text-base text-muted-foreground">
                    View your project evaluation results
                </p>
            </div>
            {eventId && (
                <div>
                    <Button
                        variant="light"
                        className="gap-2"
                        onClick={() => router.push('/app')}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                </div>
            )}
            <div className="w-full overflow-x-auto">
                    <div className="text-center py-12 text-muted-foreground">
                        Pronto se liberarán los resultados
                    </div>
            </div>
        </div>
    );
}