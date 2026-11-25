import type { ProjectReviewState } from "../types";

import {
  PROJECT_STATE_COLORS,
  PROJECT_STATE_LABELS,
} from "../utils/academic-labels";

/** Review state of a project: colored dot and label */
export const ProjectStateBadge = ({ state }: { state: ProjectReviewState }) => (
  <span
    className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
    style={{
      background: `color-mix(in oklch, ${PROJECT_STATE_COLORS[state]}, transparent 85%)`,
      color: PROJECT_STATE_COLORS[state],
    }}
  >
    <span
      aria-hidden="true"
      className="size-1.5 rounded-full"
      style={{ background: PROJECT_STATE_COLORS[state] }}
    />
    {PROJECT_STATE_LABELS[state]}
  </span>
);
