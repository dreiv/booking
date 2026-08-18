import { z } from 'zod';
import {
  searchQuerySchema,
  searchResultSchema,
  paginatedSearchResultsSchema,
} from 'utils/search-schema';
import { problemDetailsSchema } from 'utils/problem-details-schema';
import { useSessionStore } from '#/core/stores/useSessionStore';

export type SearchQuery = Partial<z.infer<typeof searchQuerySchema>>;
export type SearchResult = z.infer<typeof searchResultSchema>;
export type PaginatedSearchResults = z.infer<typeof paginatedSearchResultsSchema>;

// Extracts error details from problem+json body or falls back to status code.
async function extractErrorMessage(res: Response): Promise<string> {
  try {
    const body: unknown = await res.json();
    const problem = problemDetailsSchema.safeParse(body);
    if (problem.success) return problem.data.detail;
  } catch {
    // Non-JSON response
  }
  return `Request failed with status ${res.status}`;
}

export async function searchStays(query: SearchQuery = {}): Promise<PaginatedSearchResults> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;
    // amenities arrives as string[] client-side; the server expects a
    // comma-separated value (searchQuerySchema splits it back apart).
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      params.set(key, value.join(','));
    } else {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();

  const res = await fetch(`/api/v1/search${qs ? `?${qs}` : ''}`, {
    headers: useSessionStore().authHeaders(),
  });
  if (!res.ok) {
    throw new Error(await extractErrorMessage(res));
  }
  const body: unknown = await res.json();
  const result = paginatedSearchResultsSchema.safeParse(body);
  if (!result.success) {
    throw new Error(`Received malformed search response: ${result.error.message}`);
  }
  return result.data;
}
