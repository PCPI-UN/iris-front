import { eventsPrivateHandlers } from "./events.private.handlers";
import { eventsPublicHandlers } from "./events.public.handlers";

export const eventsHandlers = [
  ...eventsPublicHandlers,
  ...eventsPrivateHandlers,
];
