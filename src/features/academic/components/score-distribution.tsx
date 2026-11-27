import type { ScoreBucket } from "../types";

import { formatPoints } from "../utils/academic-grades";

/** How many final grades fall in each range of the scale ([from, to), the last one with `to`) */
export const ScoreDistribution = ({ buckets }: { buckets: ScoreBucket[] }) => {
  const highest = Math.max(...buckets.map((bucket) => bucket.count), 1);

  return (
    <ul aria-label="Distribución de notas" className="flex flex-col gap-2">
      {buckets.map((bucket) => {
        const range = `${formatPoints(bucket.from)} – ${formatPoints(bucket.to)}`;

        return (
          <li
            key={range}
            className="grid grid-cols-[5.5rem_minmax(0,1fr)_2rem] items-center gap-3 text-xs"
          >
            <span className="tabular-nums text-slate-400">{range}</span>
            <span
              aria-hidden="true"
              className="block h-3 overflow-hidden rounded-full bg-white/5"
            >
              <span
                className="block h-full rounded-full bg-cyan-400"
                style={{ width: `${(bucket.count / highest) * 100}%` }}
              />
            </span>
            <span className="text-right font-semibold tabular-nums text-white">
              {bucket.count}
              <span className="sr-only">
                {bucket.count === 1 ? " proyecto" : " proyectos"}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
};
