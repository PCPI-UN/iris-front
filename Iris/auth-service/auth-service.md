# Auth Service

## Purpose

This service manages user accounts, platform staff assignments, authentication-related tokens, roles, and permissions.

The database is modeled with Prisma on top of PostgreSQL. Physical tables and columns use `snake_case` through `@map` and `@@map`, while the application layer exposes fields in `camelCase`.

## Base Configuration

### Generator

- `client`: generates the Prisma client using `prisma-client-js`.

### Datasource

- `db`: uses PostgreSQL and reads the connection string from the `DATABASE_URL` environment variable.

## Enums

### `UserStatus`

Defines the available account states for users.

- `PENDING`: the account exists but has not been fully confirmed.
- `CONFIRMED`: the account is active and confirmed.

### `UserTokenType`

Defines the available token purposes handled by the auth service.

- `RESET_PASSWORD`: used for password recovery flows.
- `ACCOUNT_SETUP`: used for first-time account setup flows.
- `REFRESH_TOKEN`: used to renew authenticated sessions.

## Models

### `User`

This is the main user entity in the service. It stores identity data, authentication credentials, status, and related platform assignments.

#### Main fields

- `id`: unique auto-incremented identifier.
- `firstName`: user first name.
- `lastName`: optional user last name.
- `email`: unique email address.
- `password`: optional hashed password.
- `oid`: optional external identity identifier.
- `phone`: optional phone number.
- `active`: logical status of the user. Defaults to `true`.
- `status`: account status using the `UserStatus` enum.
- `createdAt`: creation timestamp.
- `updatedAt`: update timestamp.

#### Relationships

- One `User` has many `PlatformStaff` records.
- One `User` has many `UserToken` records.

#### Physical table

- Stored in the `users` table.

### `PlatformStaff`

This junction model assigns platform-level roles to users.

#### Main fields

- `userId`: reference to the user.
- `roleId`: reference to the role.
- `active`: indicates whether the assignment is active.
- `createdAt`: creation timestamp.
- `updatedAt`: update timestamp.

#### Relationships

- Belongs to one `User`.
- Belongs to one `Role`.

#### Constraints

- The primary key is composite: `userId` + `roleId`. This prevents the same role from being assigned more than once to the same user.

#### Physical table

- Stored in `platform_staff`.

### `UserToken`

Stores tokens issued to users for authentication and account lifecycle flows.

#### Main fields

- `id`: UUID primary key.
- `token`: unique token value.
- `userId`: reference to the user.
- `type`: token type using the `UserTokenType` enum.
- `expiresAt`: expiration timestamp.
- `usedAt`: optional timestamp indicating when the token was consumed.
- `createdAt`: creation timestamp.
- `updatedAt`: update timestamp.

#### Relationships

- Belongs to one `User`.

#### Physical table

- Stored in `user_tokens`.

### `Role`

Defines a platform role that can be assigned to users and linked to permissions.

#### Main fields

- `id`: unique auto-incremented identifier.
- `name`: unique role name.
- `description`: role description.
- `scope`: scope of the role.
- `createdAt`: creation timestamp.
- `updatedAt`: update timestamp.

#### Relationships

- Has many `Permission` records through a many-to-many relation.
- Has many `PlatformStaff` records.

#### Physical table

- Stored in `roles`.

### `Permission`

Defines an action that can be performed on a resource.

#### Main fields

- `id`: unique auto-incremented identifier.
- `action`: action name.
- `resource`: target resource name.
- `description`: optional permission description.
- `createdAt`: creation timestamp.
- `updatedAt`: update timestamp.

#### Relationships

- Has many `Role` records through a many-to-many relation.

#### Constraints

- The pair `action + resource` is unique through the `action_resource` constraint.

#### Physical table

- Stored in `permissions`.

## General Relationships

The main schema relationships are:

- `User` 1:N `PlatformStaff`
- `User` 1:N `UserToken`
- `Role` 1:N `PlatformStaff`
- `Role` N:M `Permission`

## Design Notes

- `password` is optional, which suggests the schema supports flows beyond local password authentication, such as external identity providers.
- `oid` is unique and optional, which is consistent with external authentication integrations.
- `PlatformStaff` is a pure junction model with a composite primary key.
- `Role` and `Permission` are connected through an implicit Prisma many-to-many relation named `role_permissions`.
- `active` is used as a logical state flag in both `User` and `PlatformStaff`.
