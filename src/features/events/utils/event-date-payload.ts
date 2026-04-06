type DateBoundary = 'start' | 'end';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const FIVE_HOURS_IN_MS = 5 * 60 * 60 * 1000;

const formatDateTime = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const extractDateOnly = (value?: string | null) => {
  const normalized = String(value ?? '').trim();

  if (!normalized) {
    return '';
  }

  const dateOnly = normalized.slice(0, 10);
  return DATE_ONLY_PATTERN.test(dateOnly) ? dateOnly : '';
};

const toLocalPayloadDate = (value: string, boundary: DateBoundary) => {
  const dateOnly = extractDateOnly(value);

  if (!dateOnly) {
    return value;
  }

  const [year, month, day] = dateOnly.split('-').map(Number);
  const baseDate = new Date(
    year,
    month - 1,
    day,
    boundary === 'end' ? 23 : 0,
    boundary === 'end' ? 59 : 0,
    boundary === 'end' ? 59 : 0,
  );

  const adjustedDate = new Date(baseDate.getTime() - FIVE_HOURS_IN_MS);

  return formatDateTime(adjustedDate);
};

export const normalizeEventDatesForPayload = <T extends {
  startDate: string;
  endDate: string;
  inscriptionDeadline: string;
}>(data: T): T => {
  return {
    ...data,
    startDate: toLocalPayloadDate(data.startDate, 'start'),
    endDate: toLocalPayloadDate(data.endDate, 'end'),
    inscriptionDeadline: toLocalPayloadDate(data.inscriptionDeadline, 'end'),
  };
};
