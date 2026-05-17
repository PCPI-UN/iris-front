# Category Legacy Compatibility

This folder is the **only allowed boundary** for temporary legacy naming compatibility between frontend canonical naming (`category/categories`) and backend legacy contracts (`course/courseId/courseIds`).

## Canonical Rule

- Use `categoryId` / `categoryIds` in all active frontend modules, forms, filters, and hooks.
- Do not introduce new `course*` keys outside this folder and `src/testing` mocks.

## Current Helpers

- `withLegacyCourseIdParam`
- `withLegacyCourseIdsParam`
- `normalizeCategoryId`
- `normalizeCategoryIds`
- `readCategoryIdFromSearchParams`
- `appendLegacyCourseIdToFormData`

## Removal Plan

Remove this folder once backend endpoints and contracts accept canonical `category*` naming everywhere without fallback.
