"use client";

import { useSearchParams } from "next/navigation";

import { ContentLayout } from "@/components/layouts/content-layout";
import '@/features/landing/index.css';


export const Assignments = () => {
  const searchParams = useSearchParams();
  const eventId = searchParams?.get("event");

  return (
    <ContentLayout title="Assignments">
        <div className="flex w-full">
            
            
        </div>
    </ContentLayout>
  );
};

export default Assignments