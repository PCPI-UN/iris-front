import { User } from '@/types/api';

import {
  canCreateEvent,
  canInviteJury,
  canUpdateProject,
  canViewCategories,
} from '../authorization';

const withRoles = (...names: string[]) =>
  ({
    id: '1',
    platformRoles: names.map((name) => ({ name })),
  }) as unknown as User;

describe('Authorization', () => {
  const admin = withRoles('Admin');
  const user = withRoles('User');

  test('only Admin manages events, juries and projects', () => {
    for (const can of [canCreateEvent, canInviteJury, canUpdateProject]) {
      expect(can(admin)).toBe(true);
      expect(can(user)).toBe(false);
      expect(can(null)).toBe(false);
      expect(can(undefined)).toBe(false);
    }
  });

  test('a user with several roles is Admin when one of them is', () => {
    expect(canCreateEvent(withRoles('User', 'Admin'))).toBe(true);
  });

  test('any signed-in user can view categories', () => {
    expect(canViewCategories(admin)).toBe(true);
    expect(canViewCategories(user)).toBe(true);
    expect(canViewCategories(null)).toBe(false);
    expect(canViewCategories(undefined)).toBe(false);
  });
});
