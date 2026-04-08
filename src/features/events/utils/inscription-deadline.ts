const toEndOfLocalDay = (date: Date) =>
  new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );

const parseDeadlineToEndOfDay = (value?: string | null) => {
  const rawValue = String(value ?? '').trim();

  if (!rawValue) {
    return null;
  }

  const dateOnlyValue = rawValue.split('T')[0];
  const [year, month, day] = dateOnlyValue.split('-').map(Number);

  if (year && month && day) {
    return new Date(year, month - 1, day, 23, 59, 59, 999);
  }

  const parsed = new Date(rawValue);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return toEndOfLocalDay(parsed);
};

export const hasInscriptionDeadlinePassed = (value?: string | null) => {
  const deadline = parseDeadlineToEndOfDay(value);

  if (!deadline) {
    return false;
  }

  return deadline.getTime() < Date.now();
};
