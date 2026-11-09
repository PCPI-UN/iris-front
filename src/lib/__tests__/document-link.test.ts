import { describe, expect, it } from "vitest";
import { absoluteDocumentLink, documentLink } from "../document-link";

describe("documentLink", () => {
  it("points to the gateway endpoint that redirects to a freshly signed URL", () => {
    expect(documentLink({ id: 15, projectId: 12 })).toBe(
      "/api/projects/12/documents/15/open",
    );
  });

  it("builds an absolute link for files that leave the app, such as Excel", () => {
    expect(
      absoluteDocumentLink({ id: "15", projectId: "12" }, "https://iris.example"),
    ).toBe("https://iris.example/api/projects/12/documents/15/open");
  });
});
