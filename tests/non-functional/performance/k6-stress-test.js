import http from 'k6/http';
import { check, sleep } from 'k6';

// Stress & Spike Test: Pushes Component 2 beyond nominal capacity to observe graceful degradation
export const options = {
  stages: [
    { duration: '5s', target: 20 },
    { duration: '15s', target: 80 },  // Rapid ramp-up to simulate harvest season rush
    { duration: '20s', target: 150 }, // Stress plateau
    { duration: '10s', target: 250 }, // Spike limit
    { duration: '10s', target: 0 },   // Recovery
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'], // Even under extreme stress, error rate must remain under 5%
    http_req_duration: ['p(99)<1200'], // 99% under 1.2s under spike
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export default function () {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'AgriOps-k6-StressTest/1.0.0',
    },
  };

  // High-throughput query against tasks and workforce
  const res1 = http.get(`${BASE_URL}/api/tasks`, params);
  check(res1, {
    'Stress: Tasks endpoint responding': (r) => r.status === 200,
  });

  const res2 = http.get(`${BASE_URL}/api/workers/matched?taskType=PestInspection`, params);
  check(res2, {
    'Stress: Worker matching responding': (r) => r.status === 200,
  });

  sleep(0.5);
}
