import { searchQuerySchema, paginatedSearchResultsSchema } from 'utils/search-schema';
import { problemDetailsSchema } from 'utils/problem-details-schema';
import { registry } from '../shared/openapi.ts';

function problemResponse(description: string) {
  return {
    description,
    content: { 'application/problem+json': { schema: problemDetailsSchema } },
  };
}

registry.registerPath({
  method: 'get',
  path: '/api/v1/search',
  summary: 'Search hotels by location, dates, guests, price range, and amenities',
  request: { query: searchQuerySchema },
  responses: {
    200: {
      description: 'Available room types matching the search, cheapest first',
      content: { 'application/json': { schema: paginatedSearchResultsSchema } },
    },
    400: problemResponse('Invalid or excessive query parameters'),
    429: problemResponse('Too many requests'),
  },
});
