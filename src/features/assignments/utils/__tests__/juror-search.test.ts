import type { ProjectWithJurors } from "@/features/projects/api/get-projects-with-jurors";

import {
  filterProjectsByJuror,
  filterProjectsByName,
  jurorMatches,
  normalizeSearchText,
} from "../juror-search";

const juror = (id: string, firstName: string, lastName: string) => ({
  id,
  firstName,
  lastName,
  email: `${id}@test.edu`,
});

const project = (
  id: number,
  name: string,
  jurors: ReturnType<typeof juror>[],
) => ({ id, name, jurors }) as unknown as ProjectWithJurors;

const projects = [
  project(1, "Robot clasificador", [juror("j1", "José", "Pérez Núñez")]),
  project(2, "App de reciclaje", [
    juror("j2", "Ana", "Gómez"),
    juror("j1", "José", "Pérez Núñez"),
  ]),
  project(3, "Huerta urbana", [juror("j3", "Luis", "Martínez")]),
  project(4, "Sin jurados", []),
];

describe("normalizeSearchText", () => {
  test("quita tildes, pasa a minúsculas y recorta espacios", () => {
    expect(normalizeSearchText("  ÁNGELA Núñez ")).toBe("angela nunez");
  });
});

describe("jurorMatches", () => {
  test("ignora mayúsculas y tildes", () => {
    expect(jurorMatches(juror("j1", "José", "Pérez"), "JOSE perez")).toBe(true);
  });

  test("acepta las palabras en cualquier orden", () => {
    expect(jurorMatches(juror("j1", "José", "Pérez"), "perez jose")).toBe(true);
  });

  test("no coincide si falta alguna palabra", () => {
    expect(jurorMatches(juror("j1", "José", "Pérez"), "jose gomez")).toBe(
      false,
    );
  });
});

describe("filterProjectsByJuror", () => {
  test("devuelve los proyectos en los que el jurado está asignado", () => {
    expect(filterProjectsByJuror(projects, "nunez").map((p) => p.id)).toEqual([
      1, 2,
    ]);
  });

  test("devuelve vacío si ningún proyecto tiene ese jurado", () => {
    expect(filterProjectsByJuror(projects, "Carlos")).toEqual([]);
  });

  test("sin término devuelve la lista completa", () => {
    expect(filterProjectsByJuror(projects, "   ")).toBe(projects);
  });
});

describe("filterProjectsByName", () => {
  test("filtra por nombre de proyecto sin distinguir tildes", () => {
    expect(
      filterProjectsByName(projects, "RECICLAJE").map((p) => p.id),
    ).toEqual([2]);
  });
});
