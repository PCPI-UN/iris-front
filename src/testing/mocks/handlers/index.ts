import { HttpResponse, http } from "msw";

import { env } from "@/config/env";

import { networkDelay } from "../utils";

import { juriesHandlers } from "./juries";
import { administratorsHandlers } from "./administrators";
import { authHandlers } from "./auth";
import { coursesHandlers } from "./courses";
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
  ...coursesHandlers,
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
