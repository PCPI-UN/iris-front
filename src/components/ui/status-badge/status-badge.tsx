import { labels, stylesBadge } from "./status-style";

export const StatusBadge = ({ state }: {state: "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "REQUEST_CHANGES"}) => {
  return (
    <div className="flex justify-center items-center h-min px-3 py-2 rounded-full text-xs text-center font-semibold" 
    style={{
            background: `color-mix(in oklch, ${stylesBadge[state]}, transparent 85%)`,
            color: stylesBadge[state],
    }}>
      {labels[state]}
    </div>         
  );
};