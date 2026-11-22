import { HttpResponse, http } from "msw";

import { env } from "@/config/env";

import { networkDelay, requireAuth } from "../utils";

type MockLevel = { level: number; label: string; points: number };
type MockScale = {
  id: number;
  name: string;
  description?: string;
  isSystem: boolean;
  code?: string;
  levels: MockLevel[];
  locked: boolean;
  createdAt: string;
};

const level = (labels: string[], points: number[]): MockLevel[] =>
  labels.map((label, index) => ({ level: index + 1, label, points: points[index] }));

const LABELS = ["Insuficiente", "Aceptable", "Bueno", "Excelente"];

/** Las tres escalas del sistema que siembra la migración del backend */
const systemScales = (): MockScale[] => [
  {
    id: 1,
    name: "Proyectos finales",
    isSystem: true,
    code: "FINAL_PROJECTS",
    levels: level(LABELS, [25, 55, 75, 90]),
    locked: true,
    createdAt: new Date(0).toISOString(),
  },
  {
    id: 2,
    name: "Cero a cinco",
    isSystem: true,
    code: "ZERO_TO_FIVE",
    levels: level(LABELS, [2, 3, 4, 5]),
    locked: true,
    createdAt: new Date(0).toISOString(),
  },
  {
    id: 3,
    name: "Cero a cien",
    isSystem: true,
    code: "ZERO_TO_HUNDRED",
    levels: level(LABELS, [40, 60, 80, 100]),
    locked: true,
    createdAt: new Date(0).toISOString(),
  },
];

let scales: MockScale[] = systemScales();

export const resetGradingScalesMockState = () => {
  scales = systemScales();
};

/** Mismas reglas del backend: 4 niveles con etiqueta y puntos que crecen del 1 al 4 */
const validate = (body: any): string | null => {
  if (!body || typeof body.name !== "string" || !body.name.trim()) return "El nombre es obligatorio";
  const levels: MockLevel[] = Array.isArray(body.levels) ? body.levels : [];
  if (levels.length !== 4) return "Una escala de calificación debe tener exactamente 4 niveles";
  const sorted = [...levels].sort((a, b) => a.level - b.level);
  for (let index = 1; index < sorted.length; index++) {
    if (!(sorted[index].points > sorted[index - 1].points)) {
      return "Los puntos deben crecer del nivel 1 al nivel 4";
    }
  }
  return null;
};

export const gradingScalesHandlers = [
  http.get(`${env.API_URL}/grading-scales`, async ({ cookies }) => {
    await networkDelay();
    const { error } = requireAuth(cookies);
    if (error) return HttpResponse.json({ message: error }, { status: 401 });
    return HttpResponse.json(scales);
  }),

  http.get(`${env.API_URL}/grading-scales/:id`, async ({ cookies, params }) => {
    await networkDelay();
    const { error } = requireAuth(cookies);
    if (error) return HttpResponse.json({ message: error }, { status: 401 });
    const scale = scales.find((item) => item.id === Number(params.id));
    if (!scale) {
      return HttpResponse.json({ message: `Escala de calificación ${params.id} no encontrada` }, { status: 404 });
    }
    return HttpResponse.json(scale);
  }),

  http.post(`${env.API_URL}/grading-scales`, async ({ cookies, request }) => {
    await networkDelay();
    const { error } = requireAuth(cookies);
    if (error) return HttpResponse.json({ message: error }, { status: 401 });
    const body = (await request.json()) as any;
    const problem = validate(body);
    if (problem) {
      return HttpResponse.json({ message: `Escala de calificación inválida: ${problem}` }, { status: 400 });
    }
    const scale: MockScale = {
      id: Math.max(...scales.map((item) => item.id)) + 1,
      name: body.name.trim(),
      description: body.description,
      isSystem: false,
      levels: [...body.levels].sort((a: MockLevel, b: MockLevel) => a.level - b.level),
      locked: false,
      createdAt: new Date().toISOString(),
    };
    scales = [...scales, scale];
    return HttpResponse.json(scale, { status: 201 });
  }),
];
