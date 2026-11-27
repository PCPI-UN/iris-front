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
import { projectAdminHandlers } from "./project-admin";
import { usersHandlers } from "./users";
import { evaluationsHandlers } from "./evaluations";
import { dashboardHandlers } from "./dashboard";
import { studentDashboardHandlers } from "./student-dashboard";
import { gradingScalesHandlers } from "./grading-scales";
import { awardsHandlers } from "./awards";
import { jurorImportsHandlers } from "./juror-imports";
import { projectImportsHandlers } from "./project-imports";

export const handlers = [
  ...studentDashboardHandlers,
  ...jurorImportsHandlers,
  ...juriesHandlers,
  ...administratorsHandlers,
  ...authHandlers,
  ...coursesHandlers,
  // Before eventsHandlers: /events/category-awards is not an event id
  ...awardsHandlers,
  ...eventsHandlers,
  // Before projectsHandlers: POST /projects/admin is not a project id
  ...projectImportsHandlers,
  // Before projectsHandlers: /projects/tutor-candidates is not a project id
  ...projectAdminHandlers,
  ...projectsHandlers,
  ...teamsHandlers,
  ...usersHandlers,
  ...evaluationsHandlers,
  ...criterionHandlers,
  ...dashboardHandlers,
  ...gradingScalesHandlers,
  http.get(`${env.API_URL}/healthcheck`, async () => {
    await networkDelay();
    return HttpResponse.json({ ok: true });
  }),
];
