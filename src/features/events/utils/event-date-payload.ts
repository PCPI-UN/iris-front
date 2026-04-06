type DateBoundary = 'start' | 'end';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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

  const localTime = boundary === 'end' ? '23:59:59' : '00:00:00';
  return `${dateOnly}T${localTime}`;
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
