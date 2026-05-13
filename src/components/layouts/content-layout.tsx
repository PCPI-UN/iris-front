import { ExportEventReportButton } from '@/features/reports/components/export-event-report-button';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { ReactNode } from 'react';

type ContentLayoutProps = {
  children: ReactNode;
  title?: string;
};

export const ContentLayout = ({ children, title = '' }: ContentLayoutProps) => {
  const searchParams = useSearchParams();
  const eventId = searchParams?.get("event") ? Number(searchParams.get("event")) : 0;
  return (
    <div className="py-6">
      <div className="flex justify-between mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl md:text-3xl font-semibold text-white">{title}</h1>
        {
          title === 'Projects' &&
        <ExportEventReportButton
          eventId={eventId}
          onSuccess={() => console.log("Report downloaded successfully")}
          onError={(err) => console.error("Export failed:", err)}
        />
        }
      </div>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:px-8">
        {children}
      </div>
    </div>
  );
};