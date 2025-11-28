"use client";

import { useUser } from "@/lib/auth";
import { Invitations } from "./_components/invitations";

export default function InvitationsPage() {
  const user = useUser();

  return (
    <div className="dashboard-page space-y-4 md:space-y-6">
      <div className="space-y-1 md:space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">Mis invitaciones</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Aquí verás todas tus invitaciones a eventos
        </p>
      </div>
      <div className="w-full overflow-x-auto">
        <Invitations />
      </div>
    </div>
  );
}
