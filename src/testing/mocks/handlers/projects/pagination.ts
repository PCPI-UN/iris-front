
export const PAGE_SIZE = 10;

export const validatePage = (page: number): number => {
  return Math.max(1, Math.floor(page)) || 1;
};

export const calculatePagination = (
  total: number,
  page: number,
  pageSize: number = PAGE_SIZE,
) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    page: Math.min(page, totalPages),
    total,
    totalPages,
  };
};
