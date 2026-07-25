import { http, HttpResponse } from 'msw';

export const handlers = [http.get('/api', () => HttpResponse.json({ message: 'Hello from MSW!' }))];
