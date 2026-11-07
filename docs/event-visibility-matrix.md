# Matriz de visibilidad: estado del evento × contenido público

Requerimiento: IRIS-V3-EVT-01 §3.2.4 · Ref. plan: S1-07

## Cómo se define el estado

En la base de datos el evento **no tiene un campo de estado**. El estado se calcula
con las fechas en `event-service` (`domain/events/get-event-status.util.ts`), y dos
banderas cambian lo que se puede hacer con el evento:

| Estado (API) | Regla |
|---|---|
| `UPCOMING` | No ha empezado y la fecha límite de inscripción no ha pasado |
| `REGISTRATION_CLOSED` | Pasó la fecha límite de inscripción y el evento no ha empezado |
| `AVAILABLE` | El evento está en curso (entre inicio y fin) |
| `CLOSED` | Ya terminó |

| Bandera | Significado |
|---|---|
| `isPubliclyJoinable` ("Public For Join") | En `false`, el backend rechaza toda inscripción. En el panel admin, un evento próximo con esta bandera en `false` aparece en la pestaña "Drafts". Es lo que este documento llama **borrador**. |
| `active` | En `false`, el evento está **eliminado** ("Delete Event" hace borrado lógico). |

## Matriz (verificada el 2026-11-07)

✅ se muestra · ❌ no se muestra · ⚠️ se muestra y no debería

| Caso | Estado API | "Próximos Eventos" (landing) | Etiqueta en la tarjeta | "Eventos pasados" (landing) | `GET /events/public/:id` | `GET /events/public/past/:id` | `accessCode` en API pública |
|---|---|---|---|---|---|---|---|
| A. Borrador | UPCOMING | ⚠️ Sí | "Inscripciones Abiertas" ⚠️ | ❌ | ⚠️ 200 | 403 | ⚠️ Sí |
| B. Próximo | UPCOMING | ✅ Sí | "Inscripciones Abiertas" | ❌ | ✅ 200 | 403 | ⚠️ Sí |
| C. Inscripciones cerradas | REGISTRATION_CLOSED | ✅ Sí | "Inscripciones Cerradas" | ❌ | ✅ 200 | 403 | ⚠️ Sí |
| D. En curso | AVAILABLE | ✅ Sí | "Inscripciones Cerradas" | ❌ | ✅ 200 | 403 | ⚠️ Sí |
| E. Finalizado | CLOSED | ❌ | — | ✅ Sí | ✅ 200 | ✅ 200 | ⚠️ Sí |
| F. Eliminado (antes de empezar) | UPCOMING | ❌ | — | ❌ | ⚠️ 200 | 403 | ⚠️ Sí |
| G. Eliminado (finalizado) | CLOSED | ❌ | — | ❌ | ⚠️ 200 | ⚠️ 200 | ⚠️ Sí |
