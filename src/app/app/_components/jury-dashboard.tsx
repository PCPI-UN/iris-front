'use client';

import { useUser } from '@/lib/auth';
import { ProjectListView } from '@/features/jury/components/project-list-view';
import '@/features/landing/index.css';

type JuryDashboardProps = {
    eventId?: string;
};

export const JuryDashboard = ({ eventId }: JuryDashboardProps = {}) => {
    const user = useUser();

    if (eventId) {
        return (
            <div className='dashboard-page space-y-4 md:space-y-6'>
                <div className="space-y-1 md:space-y-2">
                    <h1 className="text-2xl md:text-3xl font-bold">
                        Project Jury
                    </h1>
                    <p className="text-sm md:text-base text-muted-foreground">
                        Review and evaluate projects
                    </p>
                </div>
                <div className="w-full overflow-x-auto">
                    <ProjectListView eventId={eventId} />
                </div>
            </div>
        );
    }
}