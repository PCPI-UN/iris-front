"use client";

import React, { useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Select, SelectItem } from "@/components/ui/select";
import { useFakeCategories } from "../api/use-category";

export const CategoriesDropdown = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // 🔥 viene del EventsDropdown
  const eventId = searchParams?.get("event")
    ? Number(searchParams.get("event"))
    : undefined;

  const { data: categories, isLoading } = useFakeCategories(eventId);

  const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(new Set());

  // Sync con URL
  useEffect(() => {
    const cat = searchParams?.get("category");
    if (cat) {
      setSelectedKeys(new Set(cat.split(",")));
    } else {
      setSelectedKeys(new Set());
    }
  }, [searchParams?.toString()]);

  // 🔥 Reset cuando cambia evento
  useEffect(() => {
    setSelectedKeys(new Set());
  }, [eventId]);

  const handleSelectionChange = (keys: Set<string> | string[]) => {
    const nextSet = keys instanceof Set ? keys : new Set(Array.from(keys));
    setSelectedKeys(nextSet);

    const csv = Array.from(nextSet).join(",");

    const params = new URLSearchParams();
    searchParams?.forEach((v, k) => {
      if (k === "category") return;
      params.set(k, v);
    });

    if (csv) params.set("category", csv);
    else params.delete("category");

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="w-full">
      <Select
        label="Categorías"
        placeholder={
          eventId
            ? "Selecciona categorías"
            : "Selecciona un evento primero"
        }
        selectionMode="multiple"
        selectedKeys={selectedKeys}
        onSelectionChange={(keys) =>
          handleSelectionChange(keys as Set<string>)
        }
        isLoading={isLoading}
        isDisabled={!eventId}
      >
        {categories.length > 0 ? (
          categories.map((cat) => (
            <SelectItem key={cat.id}>{cat.name}</SelectItem>
          ))
        ) : (
          <SelectItem key="no-categories" isDisabled>
            No hay categorías
          </SelectItem>
        )}
      </Select>
    </div>
  );
};