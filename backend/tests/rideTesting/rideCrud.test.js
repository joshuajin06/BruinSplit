// Signs up a new user (unique email/username).
// Creates a ride as that user.
// Updates the ride (notes and max_seats).
// Deletes the ride.
// Asserts correct status codes and response fields at each step.

// Integration tests for ride CRUD endpoints using supertest and Jest
import request from 'supertest';
import app from '../../server.js';

// Helper to sign up and login a user, returns { token, user }
async function signupAndLogin() {
  const suffix = Date.now().toString().slice(-6);
  const email = `test+${suffix}@example.com`;
  const username = `testuser_${suffix}`;
  const password = 'password123';

  // Signup
  const signupRes = await request(app)
    .post('/api/auth/signup')
    .send({ email, username, password, first_name: 'Test', last_name: 'User' });
  expect(signupRes.statusCode).toBe(201);
  const { token, user } = signupRes.body;
  expect(token).toBeTruthy();
  expect(user).toBeTruthy();
  return { token, user };
}

describe('Ride CRUD', () => {
  let token, user, rideId;

  beforeAll(async () => {
    const creds = await signupAndLogin();
    token = creds.token;
    user = creds.user;
  });

  test('Create a ride', async () => {
    const depart = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const payload = {
      origin_text: 'Westwood',
      destination_text: 'Santa Monica',
      depart_at: depart,
      platform: 'UBER',
      max_seats: 4,
      notes: 'Test ride'
    };
    const res = await request(app)
      .post('/api/rides')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
    expect(res.statusCode).toBe(201);
    expect(res.body.ride).toBeTruthy();
    expect(res.body.ride.origin_text).toBe('Westwood');
    rideId = res.body.ride.id;
  });

  test('Update the ride', async () => {
    const res = await request(app)
      .put(`/api/rides/${rideId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ notes: 'Updated notes', max_seats: 5 });
    expect(res.statusCode).toBe(200);
    expect(res.body.ride).toBeTruthy();
    expect(res.body.ride.notes).toBe('Updated notes');
    expect(res.body.ride.max_seats).toBe(5);
  });

  test('Delete the ride', async () => {
    const res = await request(app)
      .delete(`/api/rides/${rideId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });
});
