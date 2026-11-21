import { getEmailStatusView } from "../email-status";

describe("getEmailStatusView", () => {
  test.each([
    ["SENT", "Enviado", "success"],
    ["PENDING", "Pendiente", "warning"],
    ["FAILED", "Falló", "danger"],
  ])("labels %s", (status, label, color) => {
    expect(getEmailStatusView(status)).toMatchObject({ label, color });
  });

  test.each([undefined, null, "", "BOUNCED"])(
    "an unknown or absent status is shown as without information (%j)",
    (status) => {
      expect(getEmailStatusView(status)).toMatchObject({
        label: "Sin información",
        color: "default",
      });
    },
  );

  test("explains that a failed email can be resent", () => {
    expect(getEmailStatusView("FAILED").description).toMatch(/reenviar/i);
  });
});
