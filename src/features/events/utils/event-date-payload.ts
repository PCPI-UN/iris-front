const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const normalizeDateValue = (value?: string | null) => {
  const normalized = String(value ?? '').trim();

  if (!normalized) {
    return '';
  }

  if (DATE_ONLY_PATTERN.test(normalized)) {
    return normalized;
  }

  return value;
};

export const normalizeEventDatesForPayload = <T extends {
  startDate: string;
  endDate: string;
  inscriptionDeadline: string;
}>(data: T): T => {
  return {
    ...data,
    startDate: normalizeDateValue(data.startDate),
    endDate: normalizeDateValue(data.endDate),
    inscriptionDeadline: normalizeDateValue(data.inscriptionDeadline),
  };
};
