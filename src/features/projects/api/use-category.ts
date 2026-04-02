// use-fake-categories.ts
import { useEffect, useState } from "react";
import { categoriesByEvent } from "../components/fake-categories";

export const useFakeCategories = (eventId?: number) => {
  const [data, setData] = useState<{ id: number; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!eventId) {
      setData([]);
      return;
    }

    setIsLoading(true);

    // simulamos delay
    setTimeout(() => {
      setData(categoriesByEvent[eventId] || []);
      setIsLoading(false);
    }, 300);
  }, [eventId]);

  return { data, isLoading };
};