// Developers info for all versions

export type ContributorCard = {
  firstNames: string;
  lastName1: string;
  lastName2: string;
  role: string;
  version: string;
  github?: string;
  email?: string;
};

export type ContributorRoleGroup =
  | 'Frontend'
  | 'Backend'
  | 'FullStack'
  | 'UX & UI'
  | 'Software Architecture'
  | 'DevOps'
  | 'Scrum Master'
  | 'Otros';

const normalizeRole = (role: string) => role.trim().toLowerCase();

export const getContributorFullName = ({
  firstNames,
  lastName1,
  lastName2,
}: Pick<ContributorCard, 'firstNames' | 'lastName1' | 'lastName2'>) =>
  [firstNames, lastName1, lastName2].filter(Boolean).join(' ');

export const getContributorRoleLabels = (role: string) =>
  role
    .split(/\s+-\s+/)
    .map((roleLabel) => roleLabel.trim())
    .filter(Boolean);

export const getContributorRoleGroup = (role: string): ContributorRoleGroup => {
  const normalizedRole = normalizeRole(role);
  // Simple keyword-based mapping to role groups
  if (normalizedRole.includes('frontend')) return 'Frontend';
  if (normalizedRole.includes('backend')) return 'Backend';
  if (normalizedRole.includes('devops')) return 'DevOps';
  if (normalizedRole.includes('scrum')) return 'Scrum Master';
  if (normalizedRole.includes('architect')) return 'Software Architecture';
  if (normalizedRole.includes('ui/ux') || normalizedRole.includes('ux') || normalizedRole.includes('ui')) {
    return 'UX & UI';
  }
  if (normalizedRole.includes('full stack') || normalizedRole.includes('fullstack')) return 'FullStack';

  return 'Otros';
};

export const contributors: ContributorCard[] = [
  { firstNames: 'Juan Andrés', lastName1: 'Povea', lastName2: 'Fernandez', role: 'Backend Leader', version: 'v1.0', github: 'https://github.com/J-Povea21', email:'japovea@uninorte.edu.co' },
  { firstNames: 'Jorge Luis', lastName1: 'Sánchez', lastName2: 'Barrenche', role: 'Frontend Leader', version: 'v1.0', github: 'https://github.com/jorgeluissanchez', email:'jlbarreneche@uninorte.edu.co' },
  { firstNames: 'Alejandra', lastName1: 'Valencia', lastName2: 'Rua', role: 'Scrum Master - Backend Developer', version: 'v1.0', github: 'https://github.com/alejavalerua', email:'alejandrarua@uninorte.edu.co' },
  { firstNames: 'Carlos Elías', lastName1: 'López', lastName2: 'Gallardo', role: 'UI/UX Leader - Frontend Developer', version: 'v1.0', github: 'https://github.com/cegallardo0405', email:'cegallardo@uninorte.edu.co' },
  { firstNames: 'Yovany', lastName1: 'Zhu', lastName2: 'Ye', role: 'Full Stack Developer', version: 'v1.0', github: 'https://github.com/yzhuye', email:'yzhu@uninorte.edu.co' },
  { firstNames: 'Jhonatan Smith', lastName1: 'Romero Pacheco', lastName2: '', role: 'Frontend Developer', version: 'v1.0', github: 'https://github.com/jhonatanrp05', email:'jpachecos@uninorte.edu.co' },
  { firstNames: 'Jesús David', lastName1: 'Cantillo', lastName2: 'Guerrero', role: 'Backend Developer', version: 'v1.0', github: 'https://github.com/suscantillo', email:'jesusguerrero@uninorte.edu.co' },
  { firstNames: 'Juan Miguel', lastName1: 'Carrasquilla', lastName2: 'Escobar', role: 'Backend Developer', version: 'v1.0', github: 'https://github.com/JuanMicarras', email:'jmcarrasquilla@uninorte.edu.co' },
  { firstNames: 'Samuel José', lastName1: 'Robles', lastName2: 'Batista', role: 'Backend Developer', version: 'v1.0', github: 'https://github.com/Sjrobles', email:'sjrobles@uninorte.edu.co' },
  { firstNames: 'Gabriel Elias', lastName1: 'Palencia', lastName2: 'Cure', role: 'Backend Developer', version: 'v1.0', github: 'https://github.com/GabrielPalencia', email:'gepalencia@uninorte.edu.co' },
  { firstNames: 'Daniel José', lastName1: 'Romero', lastName2: 'Martínez', role: 'Software Architect', version: 'v1.0', github: 'https://github.com/djromerom', email:'djromero@uninorte.edu.co' },

  { firstNames: 'Daniel José', lastName1: 'Romero', lastName2: 'Martínez', role: 'Software Architect', version: 'v2.0', github: 'https://github.com/djromerom', email:'djromero@uninorte.edu.co' },
  { firstNames: 'Kevin Jesús', lastName1: 'Torregrosa', lastName2: 'Padilla', role: 'Backend Leader', version: 'v2.0', github: 'https://github.com/MrManini', email:'kjtorregrosa@uninorte.edu.co' },
  { firstNames: 'Paula Irina', lastName1: 'Núñez', lastName2: 'Zarante', role: 'Frontend Developer', version: 'v2.0', github: 'https://github.com/pzarante', email:'pzarante@uninorte.edu.co' },
  { firstNames: 'Andrés Felipe', lastName1: 'Monserrat', lastName2: 'Ardilla', role: 'Frontend Developer', version: 'v2.0', github: 'https://github.com/AndresMonserrat', email:'monserrata@uninorte.edu.co' },
  { firstNames: 'Judith Isabel', lastName1: 'Pérez', lastName2: 'Conde', role: 'Frontend Leader - Full Stack Developer', version: 'v2.0', github: 'https://github.com/Judithpc23', email:'jiconde@uninorte.edu.co' },
  { firstNames: 'Isabella', lastName1: 'Arrieta', lastName2: 'Juliao', role: 'Full Stack Developer', version: 'v2.0', github: 'https://github.com/isaAJ05', email:'isabellajuliao@uninorte.edu.co' },
  { firstNames: 'Esteban David', lastName1: 'Arnedo', lastName2: 'Dadul', role: 'Full Stack Developer', version: 'v2.0', github: 'https://github.com/Edadul', email:'edadul@uninorte.edu.co' },
  { firstNames: 'Carlos Alberto', lastName1: 'Arango', lastName2: 'Mejía', role: 'Full Stack Developer', version: 'v2.0', github: 'https://github.com/Carlosam7', email:'arangocarlos@uninorte.edu.co' },
  { firstNames: 'Wilmer Junior', lastName1: 'Santiago', lastName2: 'Donado', role: 'Full Stack Developer', version: 'v2.0', github: 'https://github.com/WilmerJr01', email:'jwsantiago@uninorte.edu.co' },
  { firstNames: 'Camilo Andrés', lastName1: 'De la Rosa', lastName2: 'Movilla', role: 'DevOps Engineer', version: 'v2.0', github: 'https://github.com/CamiloDlRM', email:'amovillac@uninorte.edu.co' },
  { firstNames: 'Natalia Patricia', lastName1: 'Carpintero', lastName2: 'Leal', role: 'Scrum Master - Frontend Developer', version: 'v2.0', github: 'https://github.com/Carpinteron', email:'carpinteron@uninorte.edu.co' },
];
