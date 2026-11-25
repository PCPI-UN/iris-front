import type { ReactNode } from "react";

type AcademicPanelProps = {
  /** Small heading of the block ("Estudiantes", "Tutor"...) */
  title: string;
  /** Element next to the heading, such as a count */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** Glass card of the academic views, with the same look as the tiles of the home page */
export const AcademicPanel = ({
  title,
  aside,
  children,
  className = "",
}: AcademicPanelProps) => (
  <section
    className={`rounded-3xl border border-white/10 bg-[#0e101a]/80 p-5 backdrop-blur-xl ${className}`}
  >
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
        {title}
      </h2>
      {aside}
    </div>
    {children}
  </section>
);
