import http from 'k6/http';
import { sleep, check } from 'k6';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

export const options = {
  scenarios: {
    smoke_test: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
    },
    
    load_test: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '1m', target: 10 }, 
        { duration: '30s', target: 0 },   
      ],
      gracefulRampDown: '10s',
      startTime: '30s',
    },
    
    stress_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 20 },
        { duration: '1m', target: 50 },
        { duration: '20s', target: 0 },
      ],
      gracefulRampDown: '10s',
      startTime: '2m30s',
    },
    
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 100 },
        { duration: '30s', target: 100 },
        { duration: '10s', target: 0 },
      ],
      gracefulRampDown: '5s',
      startTime: '4m20s',
    },
    
    soak_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '5m', target: 10 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
      startTime: '5m10s',
    }
  },
  
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],    
    http_reqs: ['count>100'],
    http_req_waiting: ['avg<500'],    
    http_req_connecting: ['max<100'], 
    iteration_duration: ['avg<2000'], 
    checks: ['rate>0.95'], 
  },
};

const credentials = {
  email: "user@gmail.com",
  password: "password123"
};

export default function() {
  const response = http.post('http://localhost:5001/users/login', JSON.stringify(credentials), {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: '60s', 
    tags: { name: 'LoginRequest' }
  });
  
  const isSuccessful = response.status === 200;
  
  check(response, {
    'status 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'response time < 1s': (r) => r.timings.duration < 1000,
    'server processing time < 400ms': (r) => r.timings.waiting < 400,
    'TLS handshake < 100ms': (r) => r.timings.tls_handshaking < 100 || r.timings.tls_handshaking === 0,
    'connection time < 50ms': (r) => r.timings.connecting < 50,
    'receive time < 150ms': (r) => r.timings.receiving < 150,
  });
  
  if (!isSuccessful) {
    console.log(`Login failed with status ${response.status}: ${response.body}`);
  }
  
  sleep(Math.random() * 2);
}

export function handleSummary(data) {
  console.log('Login Load Test Summary:');
  
  const getMetricValue = (metric, property, defaultValue = 'N/A') => {
    try {
      if (data.metrics[metric]?.values[property] !== undefined) {
        const value = data.metrics[metric].values[property];
        return typeof value === 'number' ? value.toFixed(2) : value;
      }
      return defaultValue;
    } catch (e) {
      return defaultValue;
    }
  };
  
  console.log(`Total requests: ${getMetricValue('http_reqs', 'count', 0)}`);
  console.log(`Successful requests: ${getMetricValue('checks', 'passes', 0)}`);
  console.log(`Failed requests: ${getMetricValue('checks', 'fails', 0)}`);
  console.log(`HTTP Failed requests: ${getMetricValue('http_req_failed', 'passes', 0)}`);
  console.log(`Avg request duration: ${getMetricValue('http_req_duration', 'avg')}ms`);
  console.log(`95th percentile request duration: ${getMetricValue('http_req_duration', 'p(95)')}ms`);
  console.log(`99th percentile request duration: ${getMetricValue('http_req_duration', 'p(99)')}ms`);
  console.log(`Avg server processing time: ${getMetricValue('http_req_waiting', 'avg')}ms`);
  console.log(`Avg connection time: ${getMetricValue('http_req_connecting', 'avg')}ms`);
  
  let checkRate = 'N/A';
  try {
    if (data.metrics.checks?.values.rate !== undefined) {
      checkRate = (data.metrics.checks.values.rate * 100).toFixed(2) + '%';
    }
  } catch (e) {
  }
  console.log(`Check success rate: ${checkRate}`);
  
  return {
    'stdout': JSON.stringify(data, null, 2),
    "login-test-report.html": htmlReport(data),
  };
}