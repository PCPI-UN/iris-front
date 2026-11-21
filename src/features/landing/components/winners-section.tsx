"use client";

import { ArrowRight, Medal, Trophy, Users } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Spinner } from "@/components/ui/spinner";
import { paths } from "@/config/paths";

import {
  PublicAward,
  PublicWinnersEvent,
  usePublicWinners,
} from "../api/get-public-winners";

import { GlassCard } from "./glass-card";
import { formatDateRange } from "./events-section.utils";

export const getPositionLabel = (position: number) => `${position}° Lugar`;

const AwardItem = ({ award }: { award: PublicAward }) => (
  <li className="rounded-lg border border-white/10 bg-white/5 p-4">
    <div className="flex flex-wrap items-center gap-2">
      <span
        className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-amber-300"
        aria-label={`Posición ${award.position}${award.coWinners ? ", coganadores" : ""}`}
      >
        <Medal className="h-3.5 w-3.5" aria-hidden />
        {getPositionLabel(award.position)}
      </span>
      <span className="text-sm font-semibold text-foreground">
        {award.title}
      </span>
      {award.coWinners && (
        <Chip
          size="sm"
          variant="flat"
          color="warning"
          startContent={<Users className="h-3 w-3" />}
        >
          Coganadores
        </Chip>
      )}
    </div>

    {/* Co-winners: every winner of the award, all with the same position.
        The landing shows only the projects, never their average */}
    <ul className="mt-3 flex flex-wrap gap-2">
      {award.winners.map((winner) => (
        // Each winner in its own pill, so co-winners are told apart
        <li
          key={winner.winnerId}
          className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm text-foreground"
        >
          <Trophy className="h-3.5 w-3.5 shrink-0 text-amber-300" aria-hidden />
          <span className="break-words">
            {winner.projectName ?? "Proyecto no disponible"}
          </span>
        </li>
      ))}
    </ul>
  </li>
);

const EventWinners = ({ event }: { event: PublicWinnersEvent }) => {
  const categories = event.categories.filter(
    (category) => category.awards.length > 0,
  );
  if (categories.length === 0) return null;

  return (
    <GlassCard className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-xl font-bold leading-tight">{event.name}</h3>
          <p className="text-sm text-muted-foreground">
            {formatDateRange(event.startDate, event.endDate)}
          </p>
        </div>
        <Link
          href={paths.public.pastEvent.getHref({
            id: event.eventId,
            name: event.name,
          })}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Ver evento <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {categories.map((category) => (
          <div key={category.categoryId} className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {category.name}
            </p>
            <ul className="space-y-3">
              {[...category.awards]
                .sort((a, b) => a.position - b.position)
                .map((award) => (
                  <AwardItem key={award.awardId} award={award} />
                ))}
            </ul>
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

/**
 * Winners of every fair with published results (GET /events/public/winners).
 * Co-winners share the position of their award, as the backend assigns it.
 * Hidden when there are no published winners, so the landing has no empty block.
 */
export function WinnersSection() {
  const winnersQuery = usePublicWinners();
  const events =
    winnersQuery.data?.pages.flatMap((page) => page.events ?? []) ?? [];

  if (winnersQuery.isLoading) {
    return (
      <div className="flex justify-center py-16" aria-busy="true">
        <Spinner size="lg" />
      </div>
    );
  }

  // Nothing to show: no fair with published results yet, or the request failed
  if (winnersQuery.isError || events.length === 0) return null;

  return (
    <section
      id="ganadores"
      aria-labelledby="ganadores-title"
      className="relative z-10 mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8"
    >
      <div className="mb-10 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-primary glass-effect">
          <Trophy className="h-4 w-4" aria-hidden />
          <span className="font-semibold">Ganadores</span>
        </div>
        <h2
          id="ganadores-title"
          className="text-3xl font-black leading-tight sm:text-4xl md:text-5xl"
        >
          <span className="prismatic-text">Ganadores</span>{" "}
          <span className="text-white">de las ferias</span>
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Los proyectos premiados en cada feria.
        </p>
      </div>

      <div className="space-y-6">
        {events.map((event) => (
          <EventWinners key={event.eventId} event={event} />
        ))}
      </div>

      {winnersQuery.hasNextPage && (
        <div className="mt-8 flex justify-center">
          <Button
            variant="bordered"
            isLoading={winnersQuery.isFetchingNextPage}
            onPress={() => winnersQuery.fetchNextPage()}
          >
            Ver más ferias
          </Button>
        </div>
      )}
    </section>
  );
}
