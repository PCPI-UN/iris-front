export const PAGE_SIZE = 10;

export const validatePage = (page: number): number => {
  return Math.max(1, Math.floor(page)) || 1;
};

export const calculatePagination = (total: number, page: number) => {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return {
    page: Math.min(page, totalPages),
    total,
    totalPages,
  };
};
