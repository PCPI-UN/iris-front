import { http, HttpResponse } from "msw";

import {
  api,
  ApiError,
  getFileNameFromContentDisposition,
} from "@/lib/api-client";
import { server } from "@/testing/mocks/server";

describe("getFileNameFromContentDisposition", () => {
  test.each([
    [
      'attachment; filename="reporte_evaluacion_civil.xlsx"',
      "reporte_evaluacion_civil.xlsx",
    ],
    ["attachment; filename=reporte.xlsx", "reporte.xlsx"],
    [
      "attachment; filename*=UTF-8''reporte%20ingenier%C3%ADa.xlsx",
      "reporte ingeniería.xlsx",
    ],
  ])("reads %s", (header, expected) => {
    expect(getFileNameFromContentDisposition(header)).toBe(expected);
  });

  test.each([null, "", "attachment", "inline"])(
    "returns null for %j",
    (header) => {
      expect(getFileNameFromContentDisposition(header)).toBeNull();
    },
  );
});

describe("api.download", () => {
  test("returns the file and the name sent by the backend", async () => {
    server.use(
      http.get("*/api/files/report", () =>
        HttpResponse.arrayBuffer(new Uint8Array([80, 75, 3, 4]).buffer, {
          headers: {
            "Content-Type":
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": 'attachment; filename="reporte.xlsx"',
          },
        }),
      ),
    );

    const { blob, fileName } = await api.download("/files/report");

    expect(fileName).toBe("reporte.xlsx");
    expect(blob.size).toBe(4);
  });

  test("throws an ApiError with the status when the request fails", async () => {
    server.use(
      http.get("*/api/files/report", () =>
        HttpResponse.json({ message: "Forbidden" }, { status: 403 }),
      ),
    );

    await expect(
      api.download("/files/report", { suppressErrorNotification: true }),
    ).rejects.toMatchObject({ status: 403 } satisfies Partial<ApiError>);
  });
});
