"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

interface ExpandableTextProps {
  text: string;
  maxLines?: number;
  className?: string;
  buttonClassName?: string;
  expandLabel?: string;
  collapseLabel?: string;
}

const lineClampByLines: Record<number, string> = {
  1: "line-clamp-1",
  2: "line-clamp-2",
  3: "line-clamp-3",
  4: "line-clamp-4",
  5: "line-clamp-5",
  6: "line-clamp-6",
};

export const ExpandableText = ({
  text,
  maxLines = 2,
  className,
  buttonClassName,
  expandLabel = "Ver mas",
  collapseLabel = "Ver menos",
}: ExpandableTextProps) => {
  const [expanded, setExpanded] = useState(false);
  const clampClass = lineClampByLines[maxLines] ?? lineClampByLines[2];

  return (
    <div className={className + "flex flex-col items-start"}>
      <span className={cn("text-sm text-default-600", !expanded && clampClass)}>
        {text}
      </span>

      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className={cn(
          "mt-2 text-small font-medium text-amber-50 transition-colors hover:underline",
          buttonClassName,
        )}
      >
        {expanded ? collapseLabel : expandLabel}
      </button>
    </div>
  );
};
