import type { BreakdownItem } from "../utils/academic-grades";

import { ChevronDown } from "lucide-react";

import {
  formatPoints,
  formatWeight,
  scorePercent,
} from "../utils/academic-grades";

type ComponentBreakdownProps = {
  items: BreakdownItem[];
  /** Top of the grading scale; without it the bars are left out */
  maxScore: number | null;
  /** Accessible name of the list */
  label: string;
};

const ScoreBar = ({ percent }: { percent: number | null }) =>
  percent === null ? null : (
    <span
      aria-hidden="true"
      className="block h-1.5 overflow-hidden rounded-full bg-white/10"
    >
      <span
        className="block h-full rounded-full bg-cyan-400"
        style={{ width: `${percent}%` }}
      />
    </span>
  );

/** Each rubric component with its weight and score; opens to its criteria */
export const ComponentBreakdown = ({
  items,
  maxScore,
  label,
}: ComponentBreakdownProps) => (
  <ul aria-label={label} className="flex flex-col gap-2">
    {items.map((item) => (
      <li key={item.key}>
        <details className="group rounded-2xl border border-white/5 bg-white/[0.03]">
          <summary className="flex min-h-11 cursor-pointer list-none flex-col gap-1.5 rounded-2xl px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 [&::-webkit-details-marker]:hidden">
            <span className="flex items-center justify-between gap-3">
              <span className="min-w-0 text-sm text-slate-200">
                <span className="break-words">{item.name}</span>{" "}
                <span className="text-xs text-slate-500">
                  ({formatWeight(item.weight)})
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-1.5">
                <span className="text-sm font-semibold tabular-nums text-white">
                  {formatPoints(item.value)}
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className="size-4 text-slate-500 transition-transform group-open:rotate-180"
                />
              </span>
            </span>
            <ScoreBar percent={scorePercent(item.value, maxScore)} />
          </summary>
          <ul
            aria-label={`Criterios de ${item.name}`}
            className="flex flex-col gap-2 border-t border-white/5 px-3 py-2.5"
          >
            {item.criteria.map((criterion) => (
              <li key={criterion.key} className="flex flex-col gap-1">
                <span className="flex items-center justify-between gap-3 text-xs">
                  <span className="min-w-0 break-words text-slate-300">
                    {criterion.name}{" "}
                    <span className="text-slate-500">
                      ({formatWeight(criterion.weight)})
                    </span>
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums text-slate-200">
                    {formatPoints(criterion.value)}
                  </span>
                </span>
                <ScoreBar percent={scorePercent(criterion.value, maxScore)} />
              </li>
            ))}
          </ul>
        </details>
      </li>
    ))}
  </ul>
);
