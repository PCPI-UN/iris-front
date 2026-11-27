"use client";

import { Can } from "@/components/auth/can";
import { ContentLayout } from "@/components/layouts/content-layout";
import { CreateEvent } from "@/features/events/components/create-event";
import { GetEventsAdmin } from "@/features/events/components/get-events-admin";
import "@/features/landing/index.css";
import { PERMISSIONS } from "@/lib/authorization";

export const Events = () => {
  return (
    <ContentLayout title="Eventos">
      {/* POST /events requires manage:events; read-only roles only see the list */}
      <Can permission={PERMISSIONS.manageEvents}>
        <div className="flex justify-end">
          <CreateEvent />
        </div>
      </Can>
      <div className="mt-4">
        <GetEventsAdmin />
      </div>
    </ContentLayout>
  );
};
