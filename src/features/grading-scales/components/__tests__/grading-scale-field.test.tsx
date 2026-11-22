import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { useState } from "react";

import { server } from "@/testing/mocks/server";
import { rtlRender, screen, userEvent, waitFor, within } from "@/testing/test-utils";

import { GradingScaleSelection } from "../../utils/grading-scale-selection";
import { GradingScaleField } from "../grading-scale-field";

const catalog = [
  {
    id: 1,
    name: "Proyectos finales",
    isSystem: true,
    code: "FINAL_PROJECTS",
    locked: true,
    levels: [
      { level: 1, label: "Insuficiente", points: 25 },
      { level: 2, label: "Aceptable", points: 55 },
      { level: 3, label: "Bueno", points: 75 },
      { level: 4, label: "Excelente", points: 90 },
    ],
  },
  {
    id: 7,
    name: "Decenas",
    isSystem: false,
    locked: false,
    levels: [
      { level: 1, label: "Bajo", points: 10 },
      { level: 2, label: "Medio", points: 20 },
      { level: 3, label: "Alto", points: 30 },
      { level: 4, label: "Máximo", points: 40 },
    ],
  },
];

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  server.use(http.get("*/api/grading-scales", () => HttpResponse.json(catalog)));
});

const Harness = ({
  initial,
  onChange,
  ...props
}: {
  initial: GradingScaleSelection;
  onChange?: (value: GradingScaleSelection) => void;
  selectDefault?: boolean;
  isDisabled?: boolean;
  disabledReason?: string;
  showErrors?: boolean;
}) => {
  const [value, setValue] = useState(initial);
  return (
    <GradingScaleField
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
      {...props}
    />
  );
};

const renderField = (props: Parameters<typeof Harness>[0]) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return rtlRender(
    <QueryClientProvider client={queryClient}>
      <Harness {...props} />
    </QueryClientProvider>,
  );
};

test("preselects the default scale and shows its 4 levels with their points", async () => {
  const onChange = vi.fn();
  renderField({ initial: { mode: "catalog", scaleId: null }, selectDefault: true, onChange });

  const levels = await screen.findByRole("list", { name: "Niveles de la escala" });
  expect(onChange).toHaveBeenCalledWith({ mode: "catalog", scaleId: 1 });
  expect(within(levels).getAllByRole("listitem")).toHaveLength(4);
  expect(within(levels).getByText("Insuficiente")).toBeInTheDocument();
  expect(within(levels).getByText("90 pts")).toBeInTheDocument();
});

test("shows the levels of the chosen catalog scale", async () => {
  renderField({ initial: { mode: "catalog", scaleId: 7 } });

  const levels = await screen.findByRole("list", { name: "Niveles de la escala" });
  expect(within(levels).getByText("Máximo")).toBeInTheDocument();
  expect(within(levels).getByText("10 pts")).toBeInTheDocument();
  expect(within(levels).getByText("40 pts")).toBeInTheDocument();
});

test("a new scale whose points do not grow shows the error", async () => {
  const user = userEvent.setup();
  renderField({
    initial: {
      mode: "new",
      draft: {
        name: "Mía",
        levels: [
          { label: "A", points: "10" },
          { label: "B", points: "20" },
          { label: "C", points: "30" },
          { label: "D", points: "40" },
        ],
      },
    },
    showErrors: true,
  });

  expect(screen.queryByRole("alert")).not.toBeInTheDocument();

  const thirdPoints = screen.getByLabelText(/Puntos del nivel 3/);
  await user.clear(thirdPoints);
  await user.type(thirdPoints, "5");

  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Los puntos deben crecer del nivel 1 al nivel 4.",
    ),
  );
  expect(screen.getByText("Debe ser mayor que el nivel 2 (20).")).toBeInTheDocument();
});

test("the selector is disabled with the reason when the scale is locked", async () => {
  renderField({
    initial: { mode: "catalog", scaleId: 7 },
    isDisabled: true,
    disabledReason: "La escala ya se usó para calificar evaluaciones.",
  });

  expect(
    await screen.findByText("La escala ya se usó para calificar evaluaciones."),
  ).toBeInTheDocument();
  const trigger = screen.getByTestId("grading-scale-field").querySelector("button");
  // HeroUI marks the disabled trigger with data-disabled and pointer-events-none
  expect(trigger).toHaveAttribute("data-disabled", "true");
});
