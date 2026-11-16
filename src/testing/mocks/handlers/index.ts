import { HttpResponse, http } from "msw";

import { env } from "@/config/env";

import { networkDelay } from "../utils";

import { juriesHandlers } from "./juries";
import { administratorsHandlers } from "./administrators";
import { authHandlers } from "./auth";
import { commentsHandlers } from "./comments";
import { coursesHandlers } from "./courses";
import { discussionsHandlers } from "./discussions";
import { eventsHandlers } from "./events";
import { teamsHandlers } from "./teams";
import { criterionHandlers } from "./criterion";
import { projectsHandlers } from "./projects";
import { usersHandlers } from "./users";
import { evaluationsHandlers } from "./evaluations";
import { dashboardHandlers } from "./dashboard";
import { studentDashboardHandlers } from "./student-dashboard";

export const handlers = [
  ...studentDashboardHandlers,
  ...juriesHandlers,
  ...administratorsHandlers,
  ...authHandlers,
  ...commentsHandlers,
  ...coursesHandlers,
  ...discussionsHandlers,
  ...eventsHandlers,
  ...projectsHandlers,
  ...teamsHandlers,
  ...usersHandlers,
  ...evaluationsHandlers,
  ...criterionHandlers,
  ...dashboardHandlers,
  http.get(`${env.API_URL}/healthcheck`, async () => {
    await networkDelay();
    return HttpResponse.json({ ok: true });
  }),
];
