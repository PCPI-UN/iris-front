import { act, renderHook } from "@testing-library/react";

import { AssignmentProjects } from "../use-assignment-projects";
import { useProjectPanel } from "../use-project-panel";

const project = (id: number, jurors: string[] = []) =>
  ({
    id,
    name: `Proyecto ${id}`,
    jurors: jurors.map((name) => ({ id: name, firstName: name })),
  }) as never;

const listOf = (projects: unknown[], isLoading = false) =>
  ({ projects, isLoading }) as unknown as AssignmentProjects;

describe("useProjectPanel", () => {
  test("shows the refreshed project after the list changes (new juror)", () => {
    const { result, rerender } = renderHook(
      ({ list }) => useProjectPanel(list),
      { initialProps: { list: listOf([project(1), project(2)]) } },
    );

    act(() => result.current.open("view", project(1)));
    expect(result.current.type).toBe("view");
    expect(result.current.project?.jurors).toHaveLength(0);

    rerender({ list: listOf([project(1, ["Ana"]), project(2)]) });

    expect(result.current.project?.jurors).toHaveLength(1);
  });

  test("stays open while the list reloads and closes when the project is no longer in it", () => {
    const { result, rerender } = renderHook(
      ({ list }) => useProjectPanel(list),
      { initialProps: { list: listOf([project(1)]) } },
    );

    act(() => result.current.open("assign", project(1)));

    // Another category: the list is loading
    rerender({ list: listOf([], true) });
    expect(result.current.type).toBeUndefined();

    rerender({ list: listOf([project(2)]) });
    expect(result.current.type).toBeUndefined();

    // The panel was closed: it does not come back when the project returns
    rerender({ list: listOf([project(1)]) });
    expect(result.current.project).toBeUndefined();
  });
});
