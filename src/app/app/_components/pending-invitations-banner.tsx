"use client";

import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";

import { useInvitations } from "@/features/invitations/api/get-invitations";
import { paths } from "@/config/paths";

/**
 * Notice of the session's pending invitations, the only thing on the panel
 * that asks the person to act. Hidden while loading, on error or with none:
 * the sidebar keeps the full list.
 */
export const PendingInvitationsBanner = () => {
  const { data } = useInvitations({ status: "PENDING", page: 1, limit: 1 });
  const total = data?.meta?.total ?? 0;

  if (total === 0) return null;

  return (
    <Link
      className="group flex items-center gap-4 rounded-2xl border border-sky-400/30 bg-gradient-to-r from-sky-500/15 to-transparent p-4 transition-colors hover:border-sky-300/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
      href={paths.app.invitations.getHref()}
    >
      <span className="relative flex size-10 shrink-0 items-center justify-center rounded-2xl bg-sky-500/20">
        <Mail aria-hidden="true" className="size-5 text-sky-300" />
        <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-sky-400 text-[11px] font-bold text-slate-950">
          {total > 9 ? "9+" : total}
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-white">
          {total === 1
            ? "Tienes una invitación pendiente"
            : `Tienes ${total} invitaciones pendientes`}
        </span>
        <span className="block text-xs text-slate-400">
          Acéptala para entrar al evento con tu rol.
        </span>
      </span>
      <ArrowRight
        aria-hidden="true"
        className="size-4 shrink-0 text-sky-300 transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  );
};
