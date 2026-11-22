export interface PageResponse<T> {
  items: T[];
  nextCursor: string | null;
  total?: number;
}

export interface CursorQuery {
  cursor?: string | null;
  limit?: number;
  search?: string;
  [key: string]: string | number | boolean | null | undefined;
}
