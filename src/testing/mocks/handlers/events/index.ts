// This file groups all event handlers (public and private)
import { eventsPrivateHandlers } from "./private.handlers";
import { eventsPublicHandlers } from "./public.handlers";

export const eventsHandlers = [
  ...eventsPublicHandlers,
  ...eventsPrivateHandlers,
];
