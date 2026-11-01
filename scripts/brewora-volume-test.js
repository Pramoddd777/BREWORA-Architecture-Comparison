import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://host.docker.internal:5100';
const VUS = Number(__ENV.VUS || 20);
const ITERATIONS = Number(__ENV.ITERATIONS || 5000);

export const options = {
  scenarios: {
    volume_test: {
      executor: 'shared-iterations',
      vus: VUS,
      iterations: ITERATIONS,
      maxDuration: '3m',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
  },
};

export default function () {
  const response = http.get(
    `${BASE_URL}/api/catalog/search?q=coffee`
  );

  check(response, {
    'HTTP 200': (r) => r.status === 200,
  });
}