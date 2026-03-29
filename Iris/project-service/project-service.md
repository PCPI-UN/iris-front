# Project Service

## Purpose

This service manages projects submitted to an event, their attached documents, participant membership, juror assignments, and pending participants waiting to join.

The database is modeled with Prisma on top of PostgreSQL. Physical tables and columns use `snake_case` through `@map` and `@@map`, while the application layer exposes fields in `camelCase`.

## Base Configuration

### Generator

- `client`: generates the Prisma client using `prisma-client-js`.

### Datasource

- `db`: uses PostgreSQL and reads the connection string from the `DATABASE_URL` environment variable.

## Enums

### `ProjectState`

Defines the review status of a project.

- `UNDER_REVIEW`
- `APPROVED`
- `REJECTED`

### `TypedDocument`

Defines the allowed document types attached to a project.

- `LOGO`
- `POSTER`
- `SUPPORTING_DOCUMENT`

### `Status`

Defines the active state of a project document.

- `ACTIVE`
- `INACTIVE`

### `PendingParticipantStatus`

Defines the onboarding state of a pending participant.

- `PENDING`: captured when the project is submitted.
- `INVITED`: invitation created or sent after the project is approved.
- `JOINED`: the participant accepted and became a formal project participant.

## Models

### `Project`

This is the main entity in the service. It stores project metadata, the linked event, the linked category, and the review lifecycle.

#### Main fields

- `id`: unique auto-incremented identifier.
- `eventId`: identifier of the event that owns the project.
- `courseId`: legacy field name currently used to store the category reference.
- `name`: project name.
- `description`: optional project description.
- `eventNumber`: optional internal event number.
- `state`: project state using the `ProjectState` enum.
- `rejectionReason`: optional reason used when the project is rejected.
- `createdAt`: creation timestamp.
- `updatedAt`: update timestamp.

#### External references

- `eventId`: references `event-service.event`.
- `courseId`: despite its current name, this should be interpreted as the project category reference, not a course.

#### Relationships

- One `Project` has many `ProjectDocument` records.
- One `Project` has many `ProjectParticipant` records.
- One `Project` has many `ProjectAssignment` records.
- One `Project` has many `PendingProjectParticipant` records.

#### Constraints

- The pair `eventId + name` is unique, so the same project name cannot be repeated within the same event.

#### Physical table

- Stored in the `projects` table.

### `ProjectDocument`

Stores files associated with a project, such as logos, posters, or supporting documents.

#### Main fields

- `id`: unique auto-incremented identifier.
- `projectId`: reference to the project.
- `type`: document type using the `TypedDocument` enum.
- `state`: logical state using the `Status` enum.
- `url`: file location.
- `createdAt`: creation timestamp.
- `updatedAt`: update timestamp.

#### Relationships

- Belongs to one `Project`.

#### Physical table

- Stored in `project_documents`.

### `ProjectParticipant`

This junction model links users who are formal members of a project.

#### Main fields

- `userId`: identifier of the participant user.
- `projectId`: reference to the project.
- `studentCode`: academic or institutional student code.

#### External references

- `userId`: references `auth-service.users`.

#### Relationships

- Belongs to one `Project`.

#### Constraints

- The primary key is composite: `userId` + `projectId`. This prevents the same user from joining the same project twice.

#### Physical table

- Stored in `project_participants`.

### `ProjectAssignment`

Represents the assignment of a juror to evaluate a project.

#### Main fields

- `projectId`: reference to the project.
- `memberUserId`: juror user identifier.
- `memberEventId`: event identifier associated with the juror membership.
- `memberRoleId`: role identifier associated with the juror membership.
- `assignedAt`: assignment timestamp.
- `updatedAt`: update timestamp.

#### External references

- `memberUserId`, `memberEventId`, and `memberRoleId`: together represent the juror identity using the composite structure of `event-service.StaffEventMember`.

#### Relationships

- Belongs to one `Project`.

#### Constraints

- The primary key is composite: `projectId + memberUserId + memberEventId + memberRoleId`. This prevents duplicate assignment of the same juror to the same project.

#### Physical table

- Stored in `project_assignments`.

### `PendingProjectParticipant`

Stores participants captured before they formally join the project.

#### Main fields

- `pendingId`: unique auto-incremented identifier.
- `projectId`: reference to the project.
- `firstName`: pending participant first name.
- `lastName`: optional pending participant last name.
- `email`: pending participant email.
- `studentCode`: academic or institutional student code.
- `status`: onboarding status using the `PendingParticipantStatus` enum.
- `invitedAt`: optional invitation timestamp.
- `joinedAt`: optional join timestamp.
- `createdAt`: creation timestamp.
- `updatedAt`: update timestamp.

#### Relationships

- Belongs to one `Project`.

#### Constraints

- The pair `projectId + email` is unique, so the same pending participant email cannot be registered twice for the same project.

#### Physical table

- Stored in `pending_project_participants`.

## General Relationships

The main schema relationships are:

- `Project` 1:N `ProjectDocument`
- `Project` 1:N `ProjectParticipant`
- `Project` 1:N `ProjectAssignment`
- `Project` 1:N `PendingProjectParticipant`

## Design Notes

- `courseId` is still the field name in the schema, but based on the current domain it should be interpreted as `Category`, not `Course`.
- `ProjectParticipant` and `ProjectAssignment` use composite primary keys.
- `PendingProjectParticipant` supports a staged onboarding flow before the user becomes a formal project member.
- Juror assignment is modeled through the composite membership identity used by `event-service.StaffEventMember`.
