# Invitation Service

## Purpose

This service manages invitations sent to users for access to a target resource such as an event, the platform, or a project.

The database is modeled with Prisma on top of PostgreSQL. Physical tables and columns use `snake_case` through `@map` and `@@map`, while the application layer exposes fields in `camelCase`.

## Base Configuration

### Generator

- `client`: generates the Prisma client using `prisma-client-js`.

### Datasource

- `db`: uses PostgreSQL and reads the connection string from the `DATABASE_URL` environment variable.

## Enums

### `InvitationStatus`

Defines the current state of an invitation.

- `PENDING`
- `EXPIRED`
- `REJECTED`
- `ACCEPTED`

### `InvitationTargetType`

Defines the type of resource the invitation points to.

- `EVENT`
- `PLATFORM`
- `PROJECT`

## Models

### `Invitation`

This is the main entity in the service. It stores the invitation token, target resource, invited users, and lifecycle status.

#### Main fields

- `id`: UUID primary key.
- `token`: unique invitation token.
- `email`: invited email address.
- `targetType`: type of invited resource.
- `targetId`: identifier of the target resource.
- `status`: invitation status using the `InvitationStatus` enum.
- `expiresAt`: expiration timestamp.
- `invitedByUserId`: user who created the invitation.
- `invitedUserId`: invited user identifier.
- `createdAt`: creation timestamp.
- `updatedAt`: update timestamp.

#### External references

- `invitedByUserId`: references `auth-service.users`.
- `invitedUserId`: references `auth-service.users`.
- `targetId`: references a resource defined by `targetType`, such as an event or project managed in another service.

#### Relationships

- One `Invitation` has many `InvitationRole` records.

#### Physical table

- Stored in the `invitations` table.

### `InvitationRole`

This junction model associates an invitation with one or more roles.

#### Main fields

- `invitationId`: reference to the invitation.
- `roleId`: identifier of the granted role.

#### External references

- `roleId`: references `auth-service.roles`.

#### Relationships

- Belongs to one `Invitation`.

#### Constraints

- The primary key is composite: `invitationId` + `roleId`. This prevents the same role from being assigned twice to the same invitation.

## General Relationships

The main schema relationship is:

- `Invitation` 1:N `InvitationRole`

## Design Notes

- `targetType` and `targetId` form a polymorphic target reference, so the schema does not enforce a direct foreign key to a single table.
- Role assignment is modeled through the `InvitationRole` junction table.
- Timestamps use `Timestamptz`, which preserves timezone-aware values.
