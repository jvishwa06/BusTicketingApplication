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
        { duration: '30s', target: 10 },  // Ramp-up to 10 users
        { duration: '1m', target: 10 },   // Stay at 10 users
        { duration: '30s', target: 0 },   // Ramp-down
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
    http_req_duration: ['p(95)<700', 'p(99)<1000'], // 95% of requests below 700ms, 99% below 1s
    http_req_failed: ['rate<0.01'],   // HTTP errors should be less than 1%
    http_reqs: ['count>100'],         // Ensure we're making enough requests
    http_req_waiting: ['avg<500'],    // Server processing time
    http_req_connecting: ['max<100'], // TCP connection time
    iteration_duration: ['avg<3000'], // Overall iteration time (including sleep)
    checks: ['rate>0.95'],            // Overall check success rate
  },
};

const source = 'Banglore';
const destination = 'nyc';
const date = '2025-04-10';

const credentials = {
  email: "user@gmail.com",
  password: "password123"
};


export function setup() {
  console.log('Authenticating user before starting tests...');
  
  const loginResponse = http.post('http://localhost:5001/users/login', JSON.stringify(credentials), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  const loginSuccess = check(loginResponse, {
    'login successful': (r) => r.status === 200,
    'login has token': (r) => r.json('data.token') !== undefined,
  });
  
  if (!loginSuccess) {
    console.error(`Login failed: ${loginResponse.status} - ${loginResponse.body}`);
    return null;
  }
  
  const token = loginResponse.json('data.token');
  
  const cookies = loginResponse.cookies;
  
  let cookieStr = '';
  for (const cookieName in cookies) {
    for (const cookie of cookies[cookieName]) {
      cookieStr += `${cookieName}=${cookie.value}; `;
    }
  }
  
  console.log('Authentication successful, received token');
  
  return { cookieStr: cookieStr.trim(), token: token };
}

export default function(data) {
  if (!data || !data.cookieStr) {
    console.error('Skipping test iteration due to authentication failure');
    return;
  }
  
  const searchResponse = http.get(
    `http://localhost:5001/trips/search?source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}&date=${date}`,
    {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': data.cookieStr,
      },
      timeout: '60s',
      tags: { name: 'SearchRequest' } 
    }
  );
  
  const isSuccessful = searchResponse.status === 200 || searchResponse.status === 404;
  
  check(searchResponse, {
    'search status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    'search response has valid format': (r) => {
      try {
        const body = JSON.parse(r.body);
        return typeof body.message === 'string';
      } catch (e) {
        return false;
      }
    },
    'response time < 200ms': (r) => r.timings.duration < 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'response time < 1s': (r) => r.timings.duration < 1000,
    'server processing time < 400ms': (r) => r.timings.waiting < 400,
    'TLS handshake < 100ms': (r) => r.timings.tls_handshaking < 100 || r.timings.tls_handshaking === 0,
    'connection time < 50ms': (r) => r.timings.connecting < 50,
    'receive time < 150ms': (r) => r.timings.receiving < 150,
  });
  
  if (!isSuccessful) {
    console.log(`Search failed with status ${searchResponse.status}: ${searchResponse.body}`);
    if (searchResponse.status === 401) {
      console.log(`Cookie used: ${data.cookieStr}`);
    }
  }
  
  sleep(Math.random() * 2);
}

export function handleSummary(data) {
  console.log('Search Load Test Summary:');
  
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
  console.log(`Failed requests: ${getMetricValue('http_req_failed', 'passes', 0)}`);
  
  let checkRate = 'N/A';
  try {
    if (data.metrics.checks?.values.rate !== undefined) {
      checkRate = (data.metrics.checks.values.rate * 100).toFixed(2) + '%';
    }
  } catch (e) {
  }
  console.log(`Check pass rate: ${checkRate}`);
  
  console.log(`Avg request duration: ${getMetricValue('http_req_duration', 'avg')}ms`);
  console.log(`95th percentile request duration: ${getMetricValue('http_req_duration', 'p(95)')}ms`);
  console.log(`99th percentile request duration: ${getMetricValue('http_req_duration', 'p(99)')}ms`);
  console.log(`Avg server processing time: ${getMetricValue('http_req_waiting', 'avg')}ms`);
  console.log(`Avg connection time: ${getMetricValue('http_req_connecting', 'avg')}ms`);
  console.log(`Avg TLS handshake time: ${getMetricValue('http_req_tls_handshaking', 'avg')}ms`);
  console.log(`Avg time to first byte: ${getMetricValue('http_req_receiving', 'avg')}ms`);
  
  return {
    'stdout': JSON.stringify(data, null, 2),
    "search-test-report.html": htmlReport(data),
  };
}
