import React, { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type AvatarIconProps = {
  src?: string;
  text?: string;
  size?: number;
  alt?: string;
  className?: string;
};

export type Participant = {
  name: string;
};

export type AvatarGroupProps = {
  pendingParticipants?: Participant[];
  participants: Participant[];
  size?: number;
  gap?: number;
  className?: string;
};

/* ----------------------------- AvatarCircle ----------------------------- */

export const AvatarCircle = ({
  src,
  text,
  size = 40,
  alt = "",
  className = "",
}: AvatarIconProps) => {
  const [broken, setBroken] = useState(false);
  const dimension = `${size}px`;
  const fontSize = Math.max(10, Math.floor(size * 0.42));

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`relative inline-flex items-center justify-center rounded-full overflow-hidden ring-2 ring-neutral-500/60 bg-neutral-800 text-white ${className}`}
          style={{ width: dimension, height: dimension }}
          aria-label={alt || text || "avatar"}
        >
          {src && !broken ? (
            <img
              src={src}
              alt={alt}
              className="w-full h-full object-cover"
              onError={() => setBroken(true)}
            />
          ) : (
            <span
              style={{ fontSize }}
              className="font-semibold leading-none select-none"
            >
              {text}
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={5}>
        {alt}
      </TooltipContent>
    </Tooltip>
  );
};

/* ------------------------------- AvatarGroup ------------------------------ */

export const AvatarGroup = ({
  pendingParticipants = [],
  participants,
  size = 40,
  gap = 10,
  className = "",
}: AvatarGroupProps) => {
  const getInitials = (name: string) => {
    return (
      name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join("") || "?"
    );
  };

  // Logic to determine which participants to show (pending first, then confirmed)
  const activeMembers =
    pendingParticipants.length > 0 ? pendingParticipants : participants;

  const total = activeMembers.length;
  const showAll = total <= 3;
  const firstThree = activeMembers.slice(0, 3);
  const rest = Math.max(0, total - 3);

  return (
    <div className={`flex items-center ${className}`} style={{ gap }}>
      {firstThree.map((m, idx) => (
        <AvatarCircle
          key={`${m.name}-${idx}`}
          text={getInitials(m.name)}
          size={size}
          alt={m.name}
        />
      ))}

      {!showAll && (
        <AvatarCircle text={`+${rest}`} size={size} alt={`+${rest}`} />
      )}
    </div>
  );
};
