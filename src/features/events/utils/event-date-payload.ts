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

const toPayloadDate = (value: string) => {
  const dateOnly = extractDateOnly(value);
  return dateOnly || value;
};

export const normalizeEventDatesForPayload = <T extends {
  startDate: string;
  endDate: string;
  inscriptionDeadline: string;
}>(data: T): T => {
  return {
    ...data,
    startDate: toPayloadDate(data.startDate),
    endDate: toPayloadDate(data.endDate),
    inscriptionDeadline: toPayloadDate(data.inscriptionDeadline),
  };
};
