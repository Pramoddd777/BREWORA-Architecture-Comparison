
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
  },
};

export default function () {
  const targets = [
    {
      name: 'modular_monolith',
      url: 'http://host.docker.internal:5100/api/catalog/search?q=coffee',
    },
    {
      name: 'microservices',
      url: 'http://host.docker.internal:5000/api/catalog/search?q=coffee',
    },
  ];

  for (const target of targets) {
    const response = http.get(target.url, {
      tags: { architecture: target.name },
    });

    check(response, {
      [`${target.name}: HTTP 200`]: (r) => r.status === 200,
    });
  }

  sleep(1);
}
