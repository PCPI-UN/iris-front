/**
 * Positions come from the backend: projects whose average (rounded to 2
 * decimals) is the same share the position and are co-winners. The front never
 * recalculates ties, it only reads the positions.
 */
export const getCoWinnerPositions = (items: { position: number }[]) => {
  const counts = new Map<number, number>();
  for (const { position } of items) {
    counts.set(position, (counts.get(position) ?? 0) + 1);
  }
  return new Set(
    [...counts.entries()]
      .filter(([, count]) => count > 1)
      .map(([position]) => position),
  );
};

/** "1.er puesto", "2.º puesto"... for headings and accessible labels */
export const getPositionLabel = (position: number) => {
  if (position === 1) return "1.er puesto";
  if (position === 2) return "2.º puesto";
  if (position === 3) return "3.er puesto";
  return `${position}.º puesto`;
};

/**
 * Keeps every row whose backend-assigned position is within `limit`.
 * Co-winners tied at the last visible position are all preserved (mirrors
 * the backend `filterVisiblePositions` rule). Non-positive limits keep all rows.
 */
export const filterByTopPositions = <T extends { position: number }>(
  items: T[],
  limit: number,
): T[] => {
  if (limit <= 0) return items;
  return items.filter((item) => item.position <= limit);
};
