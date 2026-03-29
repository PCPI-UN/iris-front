// This file groups all project handlers (public and private)
import { projectsPrivateHandlers } from "./private.handlers";
import { projectsPublicHandlers } from "./public.handlers";

export const projectsHandlers = [
  ...projectsPublicHandlers,
  ...projectsPrivateHandlers,
];
