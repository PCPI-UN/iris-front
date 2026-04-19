"use client";
import { ContentLayout } from "@/components/layouts/content-layout";
import { CategoriesList } from "@/features/courses/components/courses-list";
import { EventsDropdown } from "@/features/projects/components/events-dropdown";
import { CreateCategory } from "@/features/courses/components/create-course";
import '@/features/landing/index.css';

export const Categories = () => {
  return (
    <ContentLayout title="Category Management">
      <p className="text-gray-300 mb-4 text-sm sm:text-base">Manage categories within events</p>
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <EventsDropdown />
        <CreateCategory />
      </div>
      <div className="mt-4">
        <CategoriesList />
      </div>
    </ContentLayout>
  );
};

export const Courses = Categories;
