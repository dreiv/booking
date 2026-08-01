import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 50 },
    { duration: '20s', target: 50 },
    { duration: '5s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<200'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Runs once, before any VUs start hitting the endpoints under test.
export function setup() {
  const maxRetries = 20;
  for (let i = 0; i < maxRetries; i++) {
    const res = http.get(`${BASE_URL}/health`);
    if (res.status === 200) {
      return;
    }
    sleep(0.5);
  }
  throw new Error(`Server at ${BASE_URL} never became ready`);
}

export default function () {
  const list = http.get(`${BASE_URL}/api/bookings`);
  check(list, { 'GET /api/bookings is 200': (r) => r.status === 200 });

  const payload = JSON.stringify({
    guestName: `Load Test Guest ${__VU}-${__ITER}`,
    checkIn: '2026-08-01',
    checkOut: '2026-08-03',
  });

  const create = http.post(`${BASE_URL}/api/bookings`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  check(create, { 'POST /api/bookings is 201': (r) => r.status === 201 });

  sleep(1);
}
