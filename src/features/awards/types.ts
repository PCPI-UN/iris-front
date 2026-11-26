/** Award of a category (GET/POST/PATCH/DELETE /events/category-awards) */
export type CategoryAward = {
  id: number;
  categoryId: number;
  title: string;
  /** The gateway sends "" when the award has no description */
  description: string;
  /** Monetary value; 0 when the award has none */
  value: number;
  /** Order of the award inside the category (1 = first place) */
  position: number;
  createdAt?: string;
  updatedAt?: string;
};

/** Project that won an award (GET/POST/DELETE /events/award-winners) */
export type AwardWinner = {
  id: number;
  awardId: number;
  projectId: number;
  /** Final grade of the project when the award was assigned */
  grade: number;
  createdAt?: string;
  assignedByUserId?: number;
};

export type PaginationMeta = {
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
};
