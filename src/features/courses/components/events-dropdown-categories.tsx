"use client";

import React, { useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Select, SelectItem } from "@/components/ui/select";
import { useEvents } from "@/features/events/api/get-events";

export const EventsDropdownForCategories = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const eventsQuery = useEvents({ page: 1 });
  const events = eventsQuery.data?.data || [];

  const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    const ev = searchParams?.get("event");
    if (ev) {
      setSelectedKeys(new Set([ev]));
    } else {
      setSelectedKeys(new Set());
    }
  }, [searchParams?.toString()]);

  const handleSelectionChange = (keys: Set<string> | string[]) => {
    const nextSet = keys instanceof Set ? keys : new Set(Array.from(keys));
    setSelectedKeys(nextSet);

    const selected = Array.from(nextSet)[0];

    const params = new URLSearchParams();
    searchParams?.forEach((v, k) => {
      if (k === "event") return;
      params.set(k, v);
    });

    if (selected) params.set("event", selected);
    else params.delete("event");

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div className="w-full sm:w-80">
      <Select
        label="Eventos"
        placeholder="Selecciona un evento"
        selectedKeys={selectedKeys}
        onSelectionChange={(keys) => handleSelectionChange(keys as Set<string>)}
        isLoading={eventsQuery.isLoading}
      >
        {events.length > 0 ? (
          events.map((event) => (
            <SelectItem key={event.id}>{event.name}</SelectItem>
          ))
        ) : (
          <SelectItem key="no-events" isDisabled>
            No hay eventos
          </SelectItem>
        )}
      </Select>
    </div>
  );
};
