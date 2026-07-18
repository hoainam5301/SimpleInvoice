export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
}

export type SortDirection = 'asc' | 'desc';

export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}
