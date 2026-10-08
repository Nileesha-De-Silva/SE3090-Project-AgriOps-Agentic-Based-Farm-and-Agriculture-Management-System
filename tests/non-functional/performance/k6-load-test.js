import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom Metrics
export const taskCreationDuration = new Trend('task_creation_duration');
export const dispatchQueryDuration = new Trend('dispatch_query_duration');
export const gatekeeperQueryDuration = new Trend('gatekeeper_query_duration');
export const errorRate = new Rate('custom_error_rate');
export const successfulTransactions = new Counter('successful_transactions');

// Test Configuration: Realistic multi-stage load simulation
export const options = {
  stages: [
    { duration: '10s', target: 15 }, // Warm-up: Ramp up to 15 concurrent virtual users
    { duration: '30s', target: 30 }, // Normal load: Peak morning dispatch activity
    { duration: '20s', target: 60 }, // Peak load: Multiple field scouts and supervisors
    { duration: '10s', target: 0 },  // Cool-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<300', 'p(99)<600'], // 95% of requests under 300ms, 99% under 600ms
    http_req_failed: ['rate<0.01'],                  // HTTP failure rate strictly below 1%
    custom_error_rate: ['rate<0.01'],
    task_creation_duration: ['p(95)<250'],
    dispatchQueryDuration: ['p(95)<150'],
    gatekeeperQueryDuration: ['p(95)<150'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'User-Agent': 'AgriOps-k6-PerformanceTest/1.0.0',
};

export default function () {
  const vuId = __VU;
  const iterId = __ITER;

  group('01 - Farm Task Listing & Filter Query (Read-Heavy Load)', () => {
    const res = http.get(`${BASE_URL}/api/tasks?status=Pending`, { headers: JSON_HEADERS });
    const passed = check(res, {
      'Task list status 200': (r) => r.status === 200,
      'Task list returns array': (r) => Array.isArray(r.json()),
    });
    errorRate.add(!passed);
    if (passed) successfulTransactions.add(1);
  });

  group('02 - Crop Analysis Gatekeeper Pending Approvals Query', () => {
    const start = new Date();
    const res = http.get(`${BASE_URL}/api/cropanalysis/pending`, { headers: JSON_HEADERS });
    gatekeeperQueryDuration.add(new Date() - start);

    const passed = check(res, {
      'Gatekeeper inbox status 200': (r) => r.status === 200,
      'Gatekeeper list response time < 200ms': (r) => r.timings.duration < 200,
    });
    errorRate.add(!passed);
    if (passed) successfulTransactions.add(1);
  });

  group('03 - Workforce Skill Matching & Dispatch Recommendation', () => {
    const start = new Date();
    const res = http.get(`${BASE_URL}/api/workers/matched?taskType=PestInspection&topN=5`, {
      headers: JSON_HEADERS,
    });
    dispatchQueryDuration.add(new Date() - start);

    const passed = check(res, {
      'Worker matching status 200': (r) => r.status === 200,
      'Worker matching duration < 250ms': (r) => r.timings.duration < 250,
    });
    errorRate.add(!passed);
    if (passed) successfulTransactions.add(1);
  });

  group('04 - Task Creation & State Mutation (Write Load)', () => {
    const payload = JSON.stringify({
      fieldId: 'a1111111-b222-c333-d444-e55555555555',
      cropSeasonId: null,
      title: `Perf Test Field Inspection VU-${vuId}-I-${iterId}`,
      taskType: 'PestInspection',
      priority: 'High',
      description: 'Automated performance benchmark task generation',
      targetDate: new Date(Date.now() + 86400000).toISOString(),
    });

    const start = new Date();
    const res = http.post(`${BASE_URL}/api/tasks`, payload, { headers: JSON_HEADERS });
    taskCreationDuration.add(new Date() - start);

    const passed = check(res, {
      'Task created status 201': (r) => r.status === 201,
      'Task has valid ID': (r) => r.json('id') !== undefined,
    });
    errorRate.add(!passed);
    if (passed) successfulTransactions.add(1);
  });

  sleep(1); // Think-time between user actions
}
