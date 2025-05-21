import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

const bookingErrors = new Counter('booking_errors');
const bookingSuccessRate = new Rate('booking_success_rate');
const bookingDuration = new Trend('booking_duration');
const concurrentBookingConflicts = new Counter('concurrent_booking_conflicts');

const BASE_URL = 'http://localhost:5001';
const TRIP_ID = '682cdfca62dec00397deeab3'; 

const users = [
  { email: 'user1@gmail.com', password: 'password123' },
  { email: 'user2@gmail.com', password: 'password123' }
];

const seatToBook = 26;

export const options = {
  scenarios: {
    concurrent_bookings: {
      executor: 'ramping-arrival-rate',
      startRate: 5, 
      timeUnit: '1s',
      preAllocatedVUs: 20, 
      maxVUs: 40,
      stages: [
        { target: 10, duration: '5s' },
        { target: 20, duration: '60s' },
        { target: 30, duration: '30s' },
        { target: 0, duration: '5s' },
      ],
      tags: { scenario: 'concurrent_bookings' },
      startTime: '10s'
    },
  },
  thresholds: {
    'booking_success_rate': ['rate>0.7'],
    'http_req_duration': ['p(95)<2000'],
    'http_req_failed': ['rate<0.3'],
  },
};

function login(userIndex) {
  const loginData = users[userIndex % users.length];
  const loginRes = http.post(
    `${BASE_URL}/users/login`,
    JSON.stringify(loginData),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  check(loginRes, {
    'login successful': (r) => r.status === 200,
    'login has token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success && body.data && body.data.token;
      } catch (e) {
        return false;
      }
    },
  });
  
  if (loginRes.status !== 200) {
    console.error(`Login failed: ${loginRes.status} - ${loginRes.body}`);
    return null;
  }
  
  const cookies = loginRes.cookies;
  let cookieString = '';
  Object.keys(cookies).forEach(name => {
    cookies[name].forEach(cookie => {
      cookieString += `${name}=${cookie.value}; `;
    });
  });
  
  return cookieString.trim();
}

function createBooking(authCookie, seatNumber) {
  const startTime = new Date();
  
  const bookingData = {
    tripId: TRIP_ID,
    seats: [seatNumber]
  };
  
  const bookingRes = http.post(
    `${BASE_URL}/bookings`,
    JSON.stringify(bookingData),
    {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookie
      },
      tags: { name: 'create_booking' }
    }
  );
  
  const endTime = new Date();
  const duration = endTime - startTime;
  bookingDuration.add(duration);
  
  const success = bookingRes.status === 201;
  bookingSuccessRate.add(success);
  
  if (!success) {
    bookingErrors.add(1);
    
    try {
      const body = JSON.parse(bookingRes.body);
      if (body.message && body.message.includes('already booked')) {
        concurrentBookingConflicts.add(1);
      }
    } catch (e) {
      console.error('Error parsing booking response:', e);
    }
  }
  
  check(bookingRes, {
    'booking status is 201 or 400': (r) => r.status === 201 || r.status === 400,
    'booking successful or reports conflict': (r) => {
      if (r.status === 201) return true;
      try {
        const body = JSON.parse(r.body);
        return body.message && (
          body.message.includes('already booked') || 
          body.message.includes('not enough available')
        );
      } catch (e) {
        return false;
      }
    },
  });
  
  return bookingRes;
}

export default function() {
  const userIndex = __VU % users.length;
  const authCookie = login(userIndex);
  
  if (!authCookie) {
    sleep(1);
    return;
  }
  
  group('Test Concurrent Booking', () => {
    createBooking(authCookie, seatToBook); 
  });
  
  sleep(randomIntBetween(1, 3) / 10);
}

export function handleSummary(data) {
  console.log('Concurrent Booking Test Summary:');
  
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
  console.log(`Successful bookings: ${getMetricValue('booking_success_rate', 'passes', 0)}`);
  console.log(`Failed bookings: ${getMetricValue('booking_errors', 'count', 0)}`);
  console.log(`Concurrent booking conflicts: ${getMetricValue('concurrent_booking_conflicts', 'count', 0)}`);
  console.log(`Average booking duration: ${getMetricValue('booking_duration', 'avg')}ms`);
  console.log(`95th percentile booking duration: ${getMetricValue('booking_duration', 'p(95)')}ms`);
  
  return {};
}