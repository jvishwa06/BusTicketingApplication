import http from 'k6/http';
import { check, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

const bookingErrors = new Counter('booking_errors');
const bookingSuccessRate = new Rate('booking_success_rate');
const bookingDuration = new Trend('booking_duration');
const concurrentBookingConflicts = new Counter('concurrent_booking_conflicts');

const BASE_URL = 'http://localhost:5001';
const TRIP_ID = '682d89bc162994b5a93de403'; 
const SEAT_TO_BOOK = 36;

const users = [
  { email: 'user1@gmail.com', password: 'password123' },
  { email: 'user4@gmail.com', password: 'password123' }
];

export const options = {
  vus: users.length,  
  iterations: users.length, 
  thresholds: {
    'booking_success_rate': ['rate>0.5'],
    'http_req_duration': ['p(95)<2000'],
    'http_req_failed': ['rate<0.3'],
  },
};

function login(userIndex) {
  const loginData = users[userIndex];
  const loginRes = http.post(
    `${BASE_URL}/users/login`,
    JSON.stringify(loginData),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(loginRes, {
    'login successful': (r) => r.status === 200,
    'token present': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success && body.data && body.data.token;
      } catch (e) {
        return false;
      }
    },
  });

  if (loginRes.status !== 200) return null;

  let cookieString = '';
  Object.keys(loginRes.cookies).forEach(name => {
    loginRes.cookies[name].forEach(cookie => {
      cookieString += `${name}=${cookie.value}; `;
    });
  });

  return cookieString.trim();
}

function createBooking(authCookie) {
  const bookingData = {
    tripId: TRIP_ID,
    seats: [SEAT_TO_BOOK],
  };

  const start = new Date();

  const res = http.post(
    `${BASE_URL}/bookings`,
    JSON.stringify(bookingData),
    {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': authCookie,
      },
      tags: { name: 'create_booking' }
    }
  );

  const duration = new Date() - start;
  bookingDuration.add(duration);

  const success = res.status === 201;
  bookingSuccessRate.add(success);

  if (!success) {
    bookingErrors.add(1);
    try {
      const body = JSON.parse(res.body);
      if (body.message?.includes('already booked')) {
        concurrentBookingConflicts.add(1);
      }
    } catch (_) {}
  }

  check(res, {
    'booking is 201 or conflict': (r) =>
      r.status === 201 ||
      (r.status === 400 && r.body.includes('already booked')),
  });
}

export default function () {
  const userIndex = __VU - 1;
  const authCookie = login(userIndex);
  if (!authCookie) {
    console.error(`Login failed for VU ${__VU}`);
    return;
  }

  group('Concurrent Seat Booking', () => {
    createBooking(authCookie);
  });
}

export function handleSummary(data) {
  console.log('--- Concurrent Booking Summary ---');

  const getMetricValue = (metricName, valueName) => {
    try {
      const val = data.metrics[metricName].values[valueName];
      return (typeof val === 'number') ? val.toFixed(2) : val;
    } catch {
      return 'N/A';
    }
  };

  console.log(`Total requests: ${getMetricValue('http_reqs', 'count')}`);
  console.log(`Successful bookings: ${getMetricValue('booking_success_rate', 'passes')}`);
  console.log(`Failed bookings: ${getMetricValue('booking_errors', 'count')}`);
  console.log(`Booking conflicts: ${getMetricValue('concurrent_booking_conflicts', 'count')}`);
  console.log(`Average booking duration: ${getMetricValue('booking_duration', 'avg')} ms`);
  console.log(`95th percentile booking duration: ${getMetricValue('booking_duration', 'p(95)')} ms`);

  return {};
}