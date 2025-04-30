import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';
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
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    http_req_failed: ['rate<0.05'],
    http_reqs: ['count>100'],         
    http_req_waiting: ['avg<800'],    
    http_req_connecting: ['max<200'], 
    iteration_duration: ['avg<5000'], 
    checks: ['rate>0.8'],             
  },
};

const errorRate = new Counter('errors');
const BASE_URL = 'http://localhost:5001';

const USER_CREDENTIALS = {
  email: 'user@gmail.com',
  password: 'password123'
};

function getRandomSeat() {
  return Math.floor(Math.random() * 10000);
}

export default function() {
  const loginRes = http.post(`${BASE_URL}/users/login`, JSON.stringify(USER_CREDENTIALS), {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'login' }
  });
  
  const loginSuccess = check(loginRes, {
    'login status is 200': (r) => r.status === 200,
    'login has token': (r) => {
      const body = JSON.parse(r.body);
      return body.success && body.data && body.data.token;
    },
  }, { name: 'login' });

  if (!loginSuccess) {
    console.error(`Login failed: ${loginRes.status} ${loginRes.body}`);
    errorRate.add(1);
    sleep(1);
    return;
  }

  const cookies = loginRes.cookies;
  let cookieString = '';
  Object.keys(cookies).forEach(name => {
    cookies[name].forEach(cookie => {
      cookieString += `${name}=${cookie.value}; `;
    });
  });
  
  const BOOKING_DATA = {
    tripId: '68120679db4dba45938ea7b2',
    seats: [getRandomSeat()]
  };
  
  const bookingRes = http.post(`${BASE_URL}/bookings`, JSON.stringify(BOOKING_DATA), {
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookieString.trim()
    },
    tags: { name: 'book' }
  });

  check(bookingRes, {
    'booking status is 201': (r) => r.status === 201,
    'booking successful': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success && body.message === 'Booking created successfully';
      } catch (e) {
        return false;
      }
    },
    'response time OK': (r) => r.timings.duration < 2000,
    'response time < 200ms': (r) => r.timings.duration < 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'response time < 1s': (r) => r.timings.duration < 1000,
    'server processing time < 400ms': (r) => r.timings.waiting < 400,
    'TLS handshake < 100ms': (r) => r.timings.tls_handshaking < 100 || r.timings.tls_handshaking === 0,
    'connection time < 50ms': (r) => r.timings.connecting < 50,
    'receive time < 150ms': (r) => r.timings.receiving < 150,
  }, { name: 'book' });

  sleep(Math.random() * 2);
}

export function handleSummary(data) {
  console.log('Booking Load Test Summary:');
  
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
  
  return {
    'stdout': JSON.stringify(data, null, 2),
    "booking-test-report.html": htmlReport(data),
  };
}
