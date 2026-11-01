
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  scenarios: {
    architecture_test: {
      executor: 'constant-vus',
      vus: 20,
      duration: '30s',
    },
  },

  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
  },
};

export default function () {
  const baseUrl = __ENV.BASE_URL;

  const response = http.get(
    `${baseUrl}/api/catalog/search?q=coffee`
  );

  check(response, {
    'HTTP 200': (r) => r.status === 200,
  });
}
