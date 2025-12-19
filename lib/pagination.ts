// lib/pagination.ts
/**
 * Pagination utilities for consistent cursor-based and offset-based pagination
 * across all API endpoints.
 */

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
  cursor?: string;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
    nextCursor?: string;
  };
}

/**
 * Normalize pagination params (use offset/limit pattern)
 */
export function normalizePagination(params: PaginationParams) {
  const page = Math.max(parseInt(String(params.page || 1)), 1);
  const limit = Math.min(Math.max(parseInt(String(params.limit || 20)), 1), 100); // Max 100 per page
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Generate pagination metadata
 */
export function paginationMeta(
  page: number,
  limit: number,
  total: number,
  nextCursor?: string
) {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasMore: page < totalPages,
    nextCursor,
  };
}

/**
 * Format paginated response
 */
export function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  nextCursor?: string
): PaginationResult<T> {
  return {
    data,
    pagination: paginationMeta(page, limit, total, nextCursor),
  };
}
