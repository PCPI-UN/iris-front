// Semester options
export const SEMESTER_OPTIONS = [
  { key: "1", label: "1er Semestre" },
  { key: "2", label: "2do Semestre" },
  { key: "3", label: "3er Semestre" },
  { key: "4", label: "4to Semestre" },
  { key: "5", label: "5to Semestre" },
  { key: "6", label: "6to Semestre" },
  { key: "7", label: "7mo Semestre" },
  { key: "8", label: "8vo Semestre" },
  { key: "9", label: "9no Semestre" },
  { key: "10", label: "10mo Semestre" },
];

// Career options - Universidad del Norte
export const CAREER_OPTIONS = [
  { key: "administracion_empresas", label: "Administración de Empresas" },
  { key: "administracion_turismo", label: "Administración Turística y Hotelera" },
  { key: "arquitectura", label: "Arquitectura" },
  { key: "ciencias_datos", label: "Ciencias de Datos" },
  { key: "comunicacion_social", label: "Comunicación Social y Periodismo" },
  { key: "contaduria_publica", label: "Contaduría Pública" },
  { key: "derecho", label: "Derecho" },
  { key: "diseño_grafico", label: "Diseño Gráfico" },
  { key: "diseño_industrial", label: "Diseño Industrial" },
  { key: "economia", label: "Economía" },
  { key: "enfermeria", label: "Enfermería" },
  { key: "ingenieria_biomedica", label: "Ingeniería Biomedica" },
  { key: "ingenieria_civil", label: "Ingeniería Civil" },
  { key: "ingenieria_electrica", label: "Ingeniería Eléctrica" },
  { key: "ingenieria_electronica", label: "Ingeniería Electrónica" },
  { key: "ingenieria_industrial", label: "Ingeniería Industrial" },
  { key: "ingenieria_mecanica", label: "Ingeniería Mecánica" },
  { key: "ingenieria_sistemas", label: "Ingeniería de Sistemas y computación" },
  { key: "matematicas", label: "Matemáticas" },
  { key: "medicina", label: "Medicina" },
  { key: "odontologia", label: "Odontología" },
  { key: "psicologia", label: "Psicología" },
  { key: "relaciones_internacionales", label: "Relaciones Internacionales" },
];

export const getSemesterLabel = (key: string) => {
  return SEMESTER_OPTIONS.find((opt) => opt.key === key)?.label || key;
};

export const getCareerLabel = (key: string) => {
  return CAREER_OPTIONS.find((opt) => opt.key === key)?.label || key;
};
