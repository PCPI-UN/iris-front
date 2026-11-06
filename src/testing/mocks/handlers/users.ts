import { HttpResponse, http } from "msw";

import { env } from "@/config/env";

import { db, persistDb } from "../db";
import {
  requireAuth,
  requireAdmin,
  sanitizeUser,
  networkDelay,
} from "../utils";

type ProfileBody = {
  firstName?: string;
  lastName?: string;
  phone?: string;
};

const EDITABLE_PROFILE_FIELDS = ["firstName", "lastName", "phone"];

// Same shape as GET /profile/me in the gateway
const toProfile = (user: any) => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName ?? "",
  email: user.email,
  phone: user.phone ?? "",
  status: user.status,
  roles: (user.platformRoles ?? []).map((role: { name: string }) => role.name),
  academic: { studentCode: null, career: null, semester: null, derived: true },
  projects: [],
  totalProjects: 0,
});

export const usersHandlers = [
  http.get(`${env.API_URL}/users`, async ({ cookies }) => {
    await networkDelay();

    try {
      const { user, error } = requireAuth(cookies);
      if (error) {
        return HttpResponse.json({ message: error }, { status: 401 });
      }
      const result = db.user
        .findMany({
          where: {
            teamId: {
              equals: user?.teamId,
            },
          },
        })
        .map(sanitizeUser);

      return HttpResponse.json({ data: result });
    } catch (error: any) {
      return HttpResponse.json(
        { message: error?.message || "Server Error" },
        { status: 500 },
      );
    }
  }),

  http.get(`${env.API_URL}/profile/me`, async ({ cookies }) => {
    await networkDelay();

    const { user, error } = requireAuth(cookies);
    if (error) {
      return HttpResponse.json({ message: error }, { status: 401 });
    }
    return HttpResponse.json(toProfile(user));
  }),

  http.patch(`${env.API_URL}/profile/me`, async ({ request, cookies }) => {
    await networkDelay();

    try {
      const { user, error } = requireAuth(cookies);
      if (error) {
        return HttpResponse.json({ message: error }, { status: 401 });
      }
      const data = (await request.json()) as ProfileBody;
      const rejected = Object.keys(data).filter(
        (key) => !EDITABLE_PROFILE_FIELDS.includes(key),
      );
      if (rejected.length > 0) {
        return HttpResponse.json(
          { message: `These fields cannot be edited: ${rejected.join(", ")}` },
          { status: 400 },
        );
      }
      const result = db.user.update({
        where: {
          id: {
            equals: user?.id,
          },
        },
        data,
      });
      await persistDb("user");
      return HttpResponse.json(toProfile(result));
    } catch (error: any) {
      return HttpResponse.json(
        { message: error?.message || "Server Error" },
        { status: 500 },
      );
    }
  }),

  http.delete(`${env.API_URL}/users/:userId`, async ({ cookies, params }) => {
    await networkDelay();

    try {
      const { user, error } = requireAuth(cookies);
      if (error) {
        return HttpResponse.json({ message: error }, { status: 401 });
      }
      const userId = params.userId as string;
      requireAdmin(user);
      const result = db.user.delete({
        where: {
          id: {
            equals: userId,
          },
          teamId: {
            equals: user?.teamId,
          },
        },
      });
      await persistDb("user");
      return HttpResponse.json(result);
    } catch (error: any) {
      return HttpResponse.json(
        { message: error?.message || "Server Error" },
        { status: 500 },
      );
    }
  }),
];
