import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type StudentDashboardSectionCardProps = {
  title: string;
  icon: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
};

export const StudentDashboardSectionCard = ({
  title,
  icon: Icon,
  action,
  children,
  className,
  ariaLabel,
}: StudentDashboardSectionCardProps) => {
  return (
    <section
      className={cn(
        "rounded-2xl border border-default-200/50 text-left p-5 bg-default-50/65 backdrop-blur-sm text-base sm:text-lg",
        className,
      )}
      aria-label={ariaLabel ?? title}
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="rounded-lg bg-primary/10 p-2 text-primary"
            aria-hidden="true"
          >
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <h2 className="text-xl font-semibold sm:text-2xl">{title}</h2>
          
        </div>
        {action}
      </div>

      {children}
    </section>
  );
};
