"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Select, SelectItem } from "@/components/ui/select";
import { useCategoriesByEvent } from "../api/use-category";
import type { Key } from "@react-types/shared";

export const CategoriesDropdown = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const eventId = searchParams?.get("event")
    ? Number(searchParams.get("event"))
    : undefined;

  const { data, isLoading } = useCategoriesByEvent(eventId);
  const categories = data?.categories || [];

  const selectedKeys = React.useMemo<Set<Key>>(() => {
    const cat = searchParams?.get("categoryId") || searchParams?.get("courseId");
    return cat ? new Set([cat]) : new Set<Key>();
  }, [searchParams]);

  const handleSelectionChange = (keys: Set<string> | string[]) => {
    const nextSet = keys instanceof Set ? keys : new Set(Array.from(keys));
    const value = Array.from(nextSet)[0];

    const params = new URLSearchParams();
    searchParams?.forEach((v, k) => {
      if (k === "courseId" || k === "categoryId") return;
      params.set(k, v);
    });

    if (value) params.set("categoryId", value);
    else params.delete("categoryId");

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
        selectionMode="single"
        selectedKeys={selectedKeys}
        onSelectionChange={(keys) =>
          handleSelectionChange(keys as Set<string>)
        }
        isLoading={isLoading}
        isDisabled={!eventId}
      >
        {categories.length > 0 ? (
          categories.map((category) => (
            <SelectItem key={String(category.id)}>
              {category.code}
            </SelectItem>
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