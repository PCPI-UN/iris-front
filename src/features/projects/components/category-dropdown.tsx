"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Select, SelectItem } from "@/components/ui/select";
import { useCoursesByEvent } from "../api/use-category";
import type { Key } from "@react-types/shared";

export const CategoriesDropdown = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const eventId = searchParams?.get("event")
    ? Number(searchParams.get("event"))
    : undefined;

  const { data, isLoading } = useCoursesByEvent(eventId);
  const courses = data?.courses || [];

  const selectedKeys = React.useMemo<Set<Key>>(() => {
    const cat = searchParams?.get("category");
    return cat ? new Set([cat]) : new Set<Key>();
  }, [searchParams]);

  const handleSelectionChange = (keys: Set<string> | string[]) => {
    const nextSet = keys instanceof Set ? keys : new Set(Array.from(keys));
    const value = Array.from(nextSet)[0];

    const params = new URLSearchParams();
    searchParams?.forEach((v, k) => {
      if (k === "category") return;
      params.set(k, v);
    });

    if (value) params.set("category", value);
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
        selectionMode="single"
        selectedKeys={selectedKeys}
        onSelectionChange={(keys) =>
          handleSelectionChange(keys as Set<string>)
        }
        isLoading={isLoading}
        isDisabled={!eventId}
      >
        {courses.length > 0 ? (
          courses.map((course) => (
            <SelectItem key={String(course.id)}>
              {course.code}
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