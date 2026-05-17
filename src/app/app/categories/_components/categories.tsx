"use client";
import { ContentLayout } from "@/components/layouts/content-layout";
import { CategoriesList } from "@/features/courses/components/categories-list";
import { CreateCategory } from "@/features/courses/components/create-category";
import { EventsDropdownForCategories } from "@/features/courses/components/events-dropdown-categories";
import '@/features/landing/index.css';

export const Categories = () => {
  return (
    <ContentLayout title="Category Management">
      <p className="text-gray-300 mb-4 text-sm sm:text-base">Manage categories within events</p>
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <EventsDropdownForCategories />
        <CreateCategory />
      </div>
      <div className="mt-4">
        <CategoriesList />
      </div>
    </ContentLayout>
  );
};
