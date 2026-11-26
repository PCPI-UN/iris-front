// Developers info for all versions

export type ContributorCard = {
  firstName: string;
  middleName?: string;
  lastName1: string;
  lastName2: string;
  role: string;
  version: string;
  github: string;
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
  firstName,
  middleName,
  lastName1,
  lastName2,
}: Pick<ContributorCard, 'firstName' | 'middleName' | 'lastName1' | 'lastName2'>) =>
  [firstName, middleName, lastName1, lastName2].filter(Boolean).join(' ');

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
  { firstName: 'Juan', middleName: 'Andrés', lastName1: 'Povea', lastName2: 'Fernandez', role: 'Backend Leader', version: 'v1.0', github: 'https://github.com/J-Povea21' },
  { firstName: 'Jorge', middleName: 'Luis', lastName1: 'Sánchez', lastName2: 'Barrenche', role: 'Frontend Leader', version: 'v1.0', github: 'https://github.com/jorgeluissanchez' },
  { firstName: 'Alejandra', lastName1: 'Valencia', lastName2: 'Rua', role: 'Scrum Master - Backend Developer', version: 'v1.0', github: 'https://github.com/alejavalerua' },
  { firstName: 'Carlos', middleName: 'Elías', lastName1: 'López', lastName2: 'Gallardo', role: 'UI/UX Leader - Frontend Developer', version: 'v1.0', github: 'https://github.com/cegallardo0405' },
  { firstName: 'Yovany', lastName1: 'Zhu', lastName2: 'Ye', role: 'FullStack Developer', version: 'v1.0', github: 'https://github.com/yzhuye' },
  { firstName: 'Jhonatan', middleName: 'Smith', lastName1: 'Romero Pacheco', lastName2: '', role: 'Frontend Developer', version: 'v1.0', github: 'https://github.com/jhonatanrp05' },
  { firstName: 'Jesús', middleName: 'David', lastName1: 'Cantillo', lastName2: 'Guerrero', role: 'Backend Developer', version: 'v1.0', github: 'https://github.com/suscantillo' },
  { firstName: 'Juan', middleName: 'Miguel', lastName1: 'Carrasquilla', lastName2: 'Escobar', role: 'Backend Developer', version: 'v1.0', github: 'https://github.com/JuanMicarras' },
  { firstName: 'Samuel', middleName: 'José', lastName1: 'Robles', lastName2: 'Batista', role: 'Backend Developer', version: 'v1.0', github: 'https://github.com/Sjrobles' },
  { firstName: 'Gabriel', middleName: 'Elias', lastName1: 'Palencia', lastName2: 'Cure', role: 'Backend Developer', version: 'v1.0', github: 'https://github.com/GabrielPalencia' },
  { firstName: 'Daniel', middleName: 'José', lastName1: 'Romero', lastName2: 'Martínez', role: 'Software Architect', version: 'v1.0', github: 'https://github.com/djromerom' },

  { firstName: 'Daniel', middleName: 'José', lastName1: 'Romero', lastName2: 'Martínez', role: 'Software Architect', version: 'v2.0', github: 'https://github.com/djromerom' },
  { firstName: 'Kevin', middleName: 'Jesús', lastName1: 'Torregrosa', lastName2: 'Padilla', role: 'Backend Leader', version: 'v2.0', github: 'https://github.com/MrManini' },
  { firstName: 'Andrés', middleName: 'Felipe', lastName1: 'Monserrat', lastName2: 'Ardilla', role: 'Frontend Developer', version: 'v2.0', github: 'https://github.com/AndresMonserrat' },
  { firstName: 'Judith', middleName: 'Isabel', lastName1: 'Pérez', lastName2: 'Conde', role: 'Frontend Leader - FullStack Developer', version: 'v2.0', github: 'https://github.com/Judithpc23' },
  { firstName: 'Isabella', lastName1: 'Arrieta', lastName2: 'Juliao', role: 'FullStack Developer', version: 'v2.0', github: 'https://github.com/isaAJ05' },
  { firstName: 'Paula', middleName: 'Irina', lastName1: 'Núñez', lastName2: 'Zarante', role: 'FullStack Developer', version: 'v2.0', github: 'https://github.com/pzarante' },
  { firstName: 'Esteban', middleName: 'David', lastName1: 'Arnedo', lastName2: 'Dadul', role: 'FullStack Developer', version: 'v2.0', github: 'https://github.com/Edadul' },
  { firstName: 'Carlos', middleName: 'Alberto', lastName1: 'Arango', lastName2: 'Mejía', role: 'FullStack Developer', version: 'v2.0', github: 'https://github.com/Carlosam7' },
  { firstName: 'Wilmer', middleName: 'Junior', lastName1: 'Santiago', lastName2: 'Donado', role: 'FullStack Developer', version: 'v2.0', github: 'https://github.com/WilmerJr01' },
  { firstName: 'Camilo', middleName: 'Andrés', lastName1: 'De la Rosa', lastName2: 'Movilla', role: 'DevOps Engineer', version: 'v2.0', github: 'https://github.com/CamiloDlRM' },
  { firstName: 'Natalia', middleName: 'Patricia', lastName1: 'Carpintero', lastName2: 'Leal', role: 'Scrum Master - Frontend Developer', version: 'v2.0', github: 'https://github.com/Carpinteron' },

  { firstName: 'Daniel', middleName: 'José', lastName1: 'Romero', lastName2: 'Martínez', role: 'Software Architect', version: 'v3.0', github: 'https://github.com/djromerom' },
  { firstName: 'Joshua', lastName1: 'Lobo', lastName2: '', role: 'Scrum Master', version: 'v3.0', github: 'https://github.com/Jlobo0210' },
  { firstName: 'Fatima', lastName1: 'Castro', lastName2: '', role: 'Frontend Developer', version: 'v3.0', github: 'https://github.com/FatimaCas' },
  { firstName: 'Juan', lastName1: 'Borja', lastName2: '', role: 'Backend Leader', version: 'v3.0', github: 'https://github.com/JDBorjaC' },
  { firstName: 'Samuel', lastName1: 'Camargo', lastName2: '', role: 'FullStack Developer', version: 'v3.0', github: 'https://github.com/kicconsu' },
  { firstName: 'Juan', lastName1: 'Rojas', lastName2: '', role: 'Backend Developer', version: 'v3.0', github: 'https://github.com/Bokter' },
  { firstName: 'Sebastian', lastName1: 'Santos', lastName2: '', role: 'Backend Developer', version: 'v3.0', github: 'https://github.com/SDSANTOSYT' },
  { firstName: 'Alexy', lastName1: 'Salcedo', lastName2: '', role: 'Frontend Leader', version: 'v3.0', github: 'https://github.com/ALEXYSALCED0' },
  { firstName: 'Humberto', lastName1: 'Llinas', lastName2: '', role: 'DevOps Engineer', version: 'v3.0', github: 'https://github.com/lzayrox' },
];
