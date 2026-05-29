export const formatDate = (value?: string) => {
  if (!value) return '—';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
};

export const getCourseLabel = (course: { id: number; code: string; description?: string }, fallbackId: number) => {
  if (course.code?.trim()) {
    return course.code.trim();
  }

  if (course.description?.trim()) {
    return course.description.trim();
  }

  return `Categoría ${fallbackId}`;
};