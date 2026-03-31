import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';

import { db, persistDb } from '../db';
import {
  authenticate,
  hash,
  requireAuth,
  networkDelay,
  AUTH_COOKIE,
} from '../utils';

type RegisterBody = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

type LoginBody = {
  email: string;
  password: string;
};

export const authHandlers = [
  http.post(`${env.API_URL}/auth/register`, async ({ request }) => {
    await networkDelay();
    try {
      const userObject = (await request.json()) as RegisterBody;

      const existingUser = db.user.findFirst({
        where: {
          email: {
            equals: userObject.email,
          },
        },
      });

      if (existingUser) {
        return HttpResponse.json(
          { message: 'The user already exists' },
          { status: 400 },
        );
      }

      // Create default team for user
      const team = db.team.create({
        name: `${userObject.firstName} Team`,
      });
      await persistDb('team');
      
      const teamId = team.id;
      const role = 'ADMIN';

      db.user.create({
        ...userObject,
        role,
        active: true,
        status: 'ACTIVE',
        platformRoles: [
          {
            id: role === 'ADMIN' ? 1 : 2,
            name: role === 'ADMIN' ? 'Admin' : 'User',
            scope: 'platform',
          },
        ],
        platformPermissions: role === 'ADMIN' ? ['*'] : [],
        password: hash(userObject.password),
        teamId,
      } as any);

      await persistDb('user');

      const result = authenticate({
        email: userObject.email,
        password: userObject.password,
      });

      return HttpResponse.json(result, {
        headers: {
          // with a real API servier, the token cookie should also be Secure and HttpOnly
          'Set-Cookie': `${AUTH_COOKIE}=${result.jwt}; Path=/;`,
        },
      });
    } catch (error: any) {
      return HttpResponse.json(
        { message: error?.message || 'Server Error' },
        { status: 500 },
      );
    }
  }),

  http.post(`${env.API_URL}/auth/login`, async ({ request }) => {
    await networkDelay();

    try {
      const credentials = (await request.json()) as LoginBody;
      const result = authenticate(credentials);

      return HttpResponse.json(result, {
        headers: {
          // with a real API servier, the token cookie should also be Secure and HttpOnly
          'Set-Cookie': `${AUTH_COOKIE}=${result.jwt}; Path=/;`,
        },
      });
    } catch (error: any) {
      return HttpResponse.json(
        { message: error?.message || 'Server Error' },
        { status: 500 },
      );
    }
  }),

  http.post(`${env.API_URL}/auth/logout`, async () => {
    await networkDelay();

    return HttpResponse.json(
      { message: 'Logged out' },
      {
        headers: {
          'Set-Cookie': `${AUTH_COOKIE}=; Path=/;`,
        },
      },
    );
  }),

  http.get(`${env.API_URL}/auth/me`, async ({ cookies }) => {
    await networkDelay();

    try {
<<<<<<< feature/CU-86e0d9d4g/Landing-Page-Add-public-event-detail-page
      const { user, error } = requireAuth(cookies);

      if (error || !user) {
        return HttpResponse.json(
          { message: error ?? 'Unauthorized' },
          { status: 401 },
        );
      }

      return HttpResponse.json({ data: user });
=======
      const { user } = requireAuth(cookies);

      if (!user) {
        return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }

      return HttpResponse.json(user);
>>>>>>> CU-86e0gpfwj/Event-Redesign-Create-Event-Form-new-Figma-fields
    } catch (error: any) {
      return HttpResponse.json(
        { message: error?.message || 'Server Error' },
        { status: 500 },
      );
    }
  }),
];
