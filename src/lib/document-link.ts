/** The ids the gateway needs; they arrive as numbers even if typed as strings. */
export type DocumentRef = { id: string | number; projectId: string | number };

/**
 * Stable link to a project document. The gateway redirects it to a freshly
 * signed URL of the file, so it keeps working in exported reports and tabs
 * left open, unlike `document.url`, whose signature expires in an hour.
 */
export const documentLink = (doc: DocumentRef): string =>
  `/api/projects/${doc.projectId}/documents/${doc.id}/open`;

/** Absolute version of {@link documentLink}, for links that leave the app (e.g. Excel). */
export const absoluteDocumentLink = (doc: DocumentRef, origin: string): string =>
  new URL(documentLink(doc), origin).toString();
