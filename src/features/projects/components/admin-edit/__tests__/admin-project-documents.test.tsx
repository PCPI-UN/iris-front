import { http, HttpResponse } from "msw";

import { AdminProjectDocuments } from "../admin-project-documents";

import { gatewayError, renderWithClient } from "./render-with-client";

import { server } from "@/testing/mocks/server";
import { screen, userEvent, waitFor, within } from "@/testing/test-utils";

type MockDocument = {
  id: number;
  projectId: number;
  url: string;
  type: string;
  state: string;
};

/** Serves the documents of project 7 from a list the handlers below change */
const mockDocuments = (initial: MockDocument[]) => {
  let documents = initial;
  const replaced: Array<{
    documentId: string;
    hasFile: boolean;
    reason: string | null;
  }> = [];
  const stateBodies: Array<Record<string, unknown>> = [];
  const added: Array<{ documents: string | null; files: number }> = [];

  server.use(
    http.get("*/api/projects/:projectId/admin/documents", () =>
      HttpResponse.json({ items: documents }),
    ),
    http.put(
      "*/api/projects/:projectId/admin/documents/:documentId",
      async ({ request, params }) => {
        const form = await request.formData();

        replaced.push({
          documentId: String(params.documentId),
          // jsdom and the fetch of msw do not share the File class: check it is there
          hasFile: form.has("file"),
          reason: form.get("reason") as string | null,
        });
        documents = documents.map((document) =>
          document.id === Number(params.documentId)
            ? { ...document, url: "https://files.test/logo-nuevo.png?sig=2" }
            : document,
        );

        return HttpResponse.json(
          documents.find(
            (document) => document.id === Number(params.documentId),
          ),
        );
      },
    ),
    http.patch(
      "*/api/projects/:projectId/admin/documents/:documentId/state",
      async ({ request, params }) => {
        const body = (await request.json()) as Record<string, unknown>;

        stateBodies.push(body);
        documents = documents.map((document) =>
          document.id === Number(params.documentId)
            ? { ...document, state: String(body.state) }
            : document,
        );

        return HttpResponse.json({});
      },
    ),
    http.post("*/api/projects/:projectId/documents", async ({ request }) => {
      const form = await request.formData();
      const metadata = form.get("documents") as string | null;
      const [{ type }] = JSON.parse(metadata ?? "[{}]");

      added.push({ documents: metadata, files: form.getAll("files").length });
      documents = [
        ...documents,
        {
          id: documents.length + 10,
          projectId: 7,
          url: `https://files.test/${String(type).toLowerCase()}-agregado.png`,
          type,
          state: "ACTIVE",
        },
      ];

      return HttpResponse.json({}, { status: 201 });
    }),
  );

  return { replaced, stateBodies, added };
};

const DOCUMENTS: MockDocument[] = [
  {
    id: 1,
    projectId: 7,
    url: "https://files.test/logo-viejo.png?sig=1",
    type: "LOGO",
    state: "ACTIVE",
  },
  {
    id: 2,
    projectId: 7,
    url: "https://files.test/poster.pdf?sig=1",
    type: "POSTER",
    state: "INACTIVE",
  },
];

const section = (name: string) => screen.getByRole("region", { name });

describe("AdminProjectDocuments", () => {
  test("groups the documents by type, inactive ones included", async () => {
    mockDocuments(DOCUMENTS);
    renderWithClient(<AdminProjectDocuments projectId={7} />);

    expect(await screen.findByAltText("Logo del proyecto")).toHaveAttribute(
      "src",
      "https://files.test/logo-viejo.png?sig=1",
    );
    expect(
      within(section("Póster")).getByText(/^Inactivo/),
    ).toBeInTheDocument();
    expect(
      within(section("Documento de soporte")).getByText(
        "El proyecto no tiene este documento.",
      ),
    ).toBeInTheDocument();
  });

  test("replaces the logo and shows the new one", async () => {
    const { replaced } = mockDocuments(DOCUMENTS);
    const user = userEvent.setup();

    renderWithClient(<AdminProjectDocuments projectId={7} />);
    await screen.findByAltText("Logo del proyecto");
    await user.type(
      screen.getByRole("textbox", { name: /motivo/i }),
      "Logo corrupto",
    );
    await user.upload(
      screen.getByLabelText("Archivo nuevo de Logo"),
      new File(["png"], "logo-nuevo.png", { type: "image/png" }),
    );

    await waitFor(() =>
      expect(screen.getByAltText("Logo del proyecto")).toHaveAttribute(
        "src",
        "https://files.test/logo-nuevo.png?sig=2",
      ),
    );
    expect(replaced).toHaveLength(1);
    expect(replaced[0].documentId).toBe("1");
    expect(replaced[0].hasFile).toBe(true);
    expect(replaced[0].reason).toBe("Logo corrupto");
  });

  test("does not upload a file larger than 5 MB", async () => {
    const { replaced } = mockDocuments(DOCUMENTS);
    const user = userEvent.setup();

    renderWithClient(<AdminProjectDocuments projectId={7} />);
    await screen.findByAltText("Logo del proyecto");
    const big = new File(["x"], "enorme.png", { type: "image/png" });

    Object.defineProperty(big, "size", { value: 6 * 1024 * 1024 });
    await user.upload(screen.getByLabelText("Archivo nuevo de Logo"), big);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El archivo no puede superar 5 MB",
    );
    expect(replaced).toHaveLength(0);
  });

  test("activates an inactive document and deactivates an active one", async () => {
    const { stateBodies } = mockDocuments(DOCUMENTS);
    const user = userEvent.setup();

    renderWithClient(<AdminProjectDocuments projectId={7} />);
    await screen.findByAltText("Logo del proyecto");

    await user.click(
      within(section("Póster")).getByRole("button", { name: "Activar" }),
    );
    await waitFor(() => expect(stateBodies).toEqual([{ state: "ACTIVE" }]));
    expect(
      await within(section("Póster")).findByRole("button", {
        name: "Desactivar",
      }),
    ).toBeInTheDocument();

    await user.click(
      within(section("Logo")).getByRole("button", { name: "Desactivar" }),
    );
    await waitFor(() => expect(stateBodies[1]).toEqual({ state: "INACTIVE" }));
  });

  test("shows the error of the backend", async () => {
    mockDocuments(DOCUMENTS);
    server.use(
      http.patch(
        "*/api/projects/:projectId/admin/documents/:documentId/state",
        () => gatewayError(400, "El documento ya está activo"),
      ),
    );
    const user = userEvent.setup();

    renderWithClient(<AdminProjectDocuments projectId={7} />);
    await screen.findByAltText("Logo del proyecto");
    await user.click(
      within(section("Póster")).getByRole("button", { name: "Activar" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El documento ya está activo",
    );
  });

  test("offers to add only the types the project still has room for", async () => {
    mockDocuments([
      ...DOCUMENTS,
      {
        id: 3,
        projectId: 7,
        url: "https://files.test/soporte.pdf",
        type: "SUPPORTING_DOCUMENT",
        state: "ACTIVE",
      },
    ]);
    renderWithClient(<AdminProjectDocuments projectId={7} />);
    await screen.findByAltText("Logo del proyecto");

    // 1 logo and 1 poster at most (an inactive one counts), 2 supporting documents
    expect(
      screen.queryByRole("button", { name: "Agregar logo" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Agregar póster" }),
    ).not.toBeInTheDocument();
    expect(
      within(section("Documento de soporte")).getByRole("button", {
        name: "Agregar documento de soporte",
      }),
    ).toBeInTheDocument();
  });

  test("adds a missing logo with POST /projects/:id/documents", async () => {
    const { added } = mockDocuments([DOCUMENTS[1]]);
    const user = userEvent.setup();

    renderWithClient(<AdminProjectDocuments projectId={7} />);
    expect(
      await screen.findByRole("button", { name: "Agregar logo" }),
    ).toBeInTheDocument();
    await user.upload(
      screen.getByLabelText("Archivo de Logo para agregar"),
      new File(["png"], "logo.png", { type: "image/png" }),
    );

    expect(await screen.findByAltText("Logo del proyecto")).toHaveAttribute(
      "src",
      "https://files.test/logo-agregado.png",
    );
    expect(added).toEqual([
      { documents: JSON.stringify([{ type: "LOGO" }]), files: 1 },
    ]);
    expect(
      screen.queryByRole("button", { name: "Agregar logo" }),
    ).not.toBeInTheDocument();
  });

  test("shows the 400 of the backend when the file cannot be added", async () => {
    mockDocuments([DOCUMENTS[1]]);
    server.use(
      http.post("*/api/projects/:projectId/documents", () =>
        gatewayError(
          400,
          "No se pueden agregar archivos: las evaluaciones de este evento ya están abiertas",
        ),
      ),
    );
    const user = userEvent.setup();

    renderWithClient(<AdminProjectDocuments projectId={7} />);
    await screen.findByRole("button", { name: "Agregar logo" });
    await user.upload(
      screen.getByLabelText("Archivo de Logo para agregar"),
      new File(["png"], "logo.png", { type: "image/png" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "las evaluaciones de este evento ya están abiertas",
    );
  });
});
