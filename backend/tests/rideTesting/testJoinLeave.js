#!/usr/bin/env node
/*
  Test script: create user -> create ride -> join ride -> leave ride
  Usage: node testJoinLeave.js
  Requires backend server running (default http://localhost:8080)
*/

const BASE = process.env.API_URL || 'http://localhost:8080';

function randSuffix() {
  return Date.now().toString().slice(-6);
}

async function postJson(path, body, token) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (_) { json = text; }
  return { status: res.status, body: json };
}

async function del(path, token) {
  const res = await fetch(BASE + path, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (_) { json = text; }
  return { status: res.status, body: json };
}

async function getJson(path, token) {
  const res = await fetch(BASE + path, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (_) { json = text; }
  return { status: res.status, body: json };
}

async function run() {
  console.log('Test start: create user -> create ride -> join -> leave');

  const suffix = randSuffix();
  const email = `test+${suffix}@example.com`;
  const username = `testuser_${suffix}`;
  const password = 'password123';

  // Signup
  console.log('Signing up user', email);
  const signup = await postJson('/api/auth/signup', { email, username, password, first_name: 'Test', last_name: 'User' });
  if (signup.status !== 201) {
    console.error('Signup failed:', signup.status, signup.body);
    process.exit(1);
  }
  const token = signup.body.token;
  if (!token) {
    console.error('Signup did not return token', signup.body);
    process.exit(1);
  }
  console.log('Signup OK, token received');

  // Create ride
  const depart = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const ridePayload = {
    origin_text: 'Westwood',
    destination_text: 'Downtown LA',
    depart_at: depart,
    platform: 'LYFT',
    max_seats: 4,
    notes: 'Test ride'
  };
  console.log('Creating ride');
  const create = await postJson('/api/rides', ridePayload, token);
  if (create.status !== 201) {
    console.error('Create ride failed:', create.status, create.body);
    process.exit(1);
  }
  const ride = create.body.ride || create.body;
  if (!ride || !ride.id) {
    console.error('Create ride response missing ride id', create.body);
    process.exit(1);
  }
  const rideId = ride.id;
  console.log('Ride created, id=', rideId);

  // Join ride
  console.log('Joining ride', rideId);
  const join = await postJson(`/api/rides/${rideId}/join`, {}, token);
  if (join.status !== 201) {
    console.error('Join failed:', join.status, join.body);
    process.exit(1);
  }
  console.log('Join OK');

  // Verify membership via GET /api/rides/:id
  console.log('Verifying membership via GET /api/rides/' + rideId);
  const get = await getJson(`/api/rides/${rideId}`, token);
  if (get.status !== 200) {
    console.error('Get ride failed:', get.status, get.body);
    process.exit(1);
  }
  const members = get.body.ride?.members || [];
  const userId = signup.body.user?.id;
  if (!members.some(m => m.user_id === userId)) {
    console.error('Membership not present after join', members);
    process.exit(1);
  }
  console.log('Membership verified');

  // Leave ride
  console.log('Leaving ride', rideId);
  const leave = await del(`/api/rides/${rideId}/leave`, token);
  if (leave.status !== 200) {
    console.error('Leave failed:', leave.status, leave.body);
    process.exit(1);
  }
  console.log('Leave OK');

  // Verify left
  const get2 = await getJson(`/api/rides/${rideId}`, token);
  if (get2.status !== 200) {
    console.error('Get ride after leave failed:', get2.status, get2.body);
    process.exit(1);
  }
  const members2 = get2.body.ride?.members || [];
  if (members2.some(m => m.user_id === userId)) {
    console.error('User still present after leave', members2);
    process.exit(1);
  }
  console.log('Leave verified — test passed');
  process.exit(0);
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
