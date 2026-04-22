const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DATE_TIME_PATTERN = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/;

export const ensureDateTimeValue = (value?: string | null) => {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return "";
  }

  if (DATE_ONLY_PATTERN.test(normalized)) {
    return `${normalized}T00:00:00`;
  }

  return normalized;
};

export const getDatePart = (value?: string | null) => {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return "";
  }

  if (DATE_ONLY_PATTERN.test(normalized)) {
    return normalized;
  }

  const dateTimeMatch = normalized.match(DATE_TIME_PATTERN);
  if (dateTimeMatch) {
    return dateTimeMatch[1];
  }

  return "";
};

export const getTimePart = (value?: string | null) => {
  const normalized = String(value ?? "").trim();
  const dateTimeMatch = normalized.match(DATE_TIME_PATTERN);

  if (dateTimeMatch) {
    return dateTimeMatch[2];
  }

  return "";
};

export const mergeDateAndTime = (date: string, time: string) => {
  const normalizedDate = date.trim();
  const normalizedTime = time.trim();

  if (!normalizedDate) {
    return "";
  }

  if (!normalizedTime) {
    return normalizedDate;
  }

  return `${normalizedDate}T${normalizedTime}:00`;
};

const normalizeForComparison = (value?: string | null) => {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return "";
  }

  if (DATE_ONLY_PATTERN.test(normalized)) {
    return `${normalized}T00:00:00`;
  }

  if (DATE_TIME_PATTERN.test(normalized)) {
    return normalized;
  }

  return normalized;
};

export const compareDateTimes = (first: string, second: string) => {
  const firstTime = Date.parse(normalizeForComparison(first));
  const secondTime = Date.parse(normalizeForComparison(second));

  if (Number.isNaN(firstTime) || Number.isNaN(secondTime)) {
    return null;
  }

  if (firstTime === secondTime) {
    return 0;
  }

  return firstTime > secondTime ? 1 : -1;
};

export const validateEventDateOrder = (
  startDate: string,
  endDate: string,
  inscriptionDeadline: string,
) => {
  if (!startDate || !endDate || !inscriptionDeadline) {
    return "";
  }

  const endVsStart = compareDateTimes(endDate, startDate);
  if (endVsStart === null) {
    return "";
  }

  if (endVsStart < 0) {
    return "End DateTime cannot be earlier than Start DateTime.";
  }

  const deadlineVsStart = compareDateTimes(inscriptionDeadline, startDate);
  if (deadlineVsStart === null) {
    return "";
  }

  if (deadlineVsStart > 0) {
    return "Inscription Deadline cannot be later than Start DateTime.";
  }

  return "";
};
