# Evaluation Service

## Purpose

This service manages project evaluations, detailed criterion scores, evaluation criteria, and the association between criteria and categories.

The database is modeled with Prisma on top of PostgreSQL. Physical tables and columns use `snake_case` through `@map` and `@@map`, while the application layer exposes fields in `camelCase`.

## Base Configuration

### Generator

- `client`: generates the Prisma client using `prisma-client-js`.

### Datasource

- `db`: uses PostgreSQL and reads the connection string from the `DATABASE_URL` environment variable.

## Models

### `Evaluation`

This is the main entity in the service. It represents an evaluation assigned by a staff member to a project.

#### Main fields

- `id`: unique auto-incremented identifier.
- `projectId`: identifier of the evaluated project.
- `memberUserId`: evaluator user identifier.
- `memberEventId`: event identifier associated with the evaluator membership.
- `memberRoleId`: evaluator role identifier within the event.
- `grade`: overall grade assigned to the project.
- `comments`: optional evaluator comments.
- `date`: date when the evaluation was recorded.
- `createdAt`: creation timestamp.
- `updatedAt`: update timestamp.

#### External references

- `projectId`: references `project-service.projects`.
- `memberUserId`, `memberEventId`, and `memberRoleId`: together represent the evaluator identity using the composite structure of `event-service.StaffEventMember`.

#### Relationships

- One `Evaluation` has many `EvaluationDetail` records.

#### Physical table

- Stored in the `evaluations` table.

### `EvaluationDetail`

This model stores the score assigned to a specific criterion within an evaluation.

#### Main fields

- `evaluationId`: reference to the evaluation.
- `criterionId`: reference to the criterion.
- `score`: score obtained for the criterion.

#### Relationships

- Belongs to one `Evaluation`.
- Belongs to one `Criterion`.

#### Constraints

- The primary key is composite: `evaluationId` + `criterionId`. This prevents duplicate scores for the same criterion within a single evaluation.

#### Physical table

- Stored in `evaluation_detail`.

### `Criterion`

Defines the criteria used to evaluate projects inside an event.

#### Main fields

- `id`: unique auto-incremented identifier.
- `eventId`: identifier of the event that owns the criterion.
- `name`: criterion name.
- `description`: optional criterion description.
- `weight`: numeric weight of the criterion in the evaluation process.
- `active`: indicates whether the criterion is currently active.
- `category`: optional grouping label for the criterion.
- `createdAt`: creation timestamp.
- `updatedAt`: update timestamp.

#### External references

- `eventId`: references `event-service.event`.

#### Relationships

- One `Criterion` has many `EvaluationDetail` records.
- One `Criterion` has many `CriterionCategory` records.

#### Physical table

- Stored in `criterions`.

### `CriterionCategory`

This junction model associates evaluation criteria with categories.

#### Main fields

- `criterionId`: reference to the criterion.
- `categoryId`: identifier of the associated category.

#### External references

- `categoryId`: references `event-service.categories`.

#### Relationships

- Belongs to one `Criterion`.

#### Constraints

- The primary key is composite: `criterionId` + `categoryId`. This prevents duplicate associations between the same criterion and category.

#### Physical table

- Stored in `criterions_categories`.

## General Relationships

The main schema relationships are:

- `Evaluation` 1:N `EvaluationDetail`
- `Criterion` 1:N `EvaluationDetail`
- `Criterion` 1:N `CriterionCategory`

## Design Notes

- The evaluator identity is not stored as a single foreign key. Instead, it is represented by `memberUserId`, `memberEventId`, and `memberRoleId`, mirroring the structure of `event-service.StaffEventMember`.
- `EvaluationDetail` and `CriterionCategory` are junction models with composite primary keys.
- `Criterion.weight` suggests that the final evaluation logic may depend on weighted scoring, although the schema itself does not enforce the calculation.
- The schema uses `Timestamp` fields instead of `Timestamptz`, which means timezone handling depends on application and database configuration.
