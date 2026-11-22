"use client";

import { ContentLayout } from "@/components/layouts/content-layout";
import { CreateEvent } from "@/features/events/components/create-event";
import { GetEventsAdmin } from "@/features/events/components/get-events-admin";
import "@/features/landing/index.css";

export const Events = () => {
  return (
    <ContentLayout title="Eventos">
      <div className="flex justify-end">
        <CreateEvent />
      </div>
      <div className="mt-4">
        <GetEventsAdmin />
      </div>
    </ContentLayout>
  );
};
