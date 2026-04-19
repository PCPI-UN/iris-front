"use client";
import { ContentLayout } from "@/components/layouts/content-layout";
import { CoursesList } from "@/features/courses/components/courses-list";
import { EventsDropdown } from "@/features/projects/components/events-dropdown";
import { CreateCourse } from "@/features/courses/components/create-course";
import '@/features/landing/index.css';

export const Courses = () => {
  return (
    <ContentLayout title="Category Management">
      <p className="text-gray-300 mb-4 text-sm sm:text-base">Manage categories within events</p>
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <EventsDropdown />
        <CreateCourse />
      </div>
      <div className="mt-4">
        <CoursesList />
      </div>
    </ContentLayout>
  );
};
