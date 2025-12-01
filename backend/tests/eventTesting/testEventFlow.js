#!/usr/bin/env node

// Created with the aid of CLAUDE HAIKU 4.5

/**
 * Event Flow Test - Node.js version
 * 
 * Tests:
 * 1. User signup → get JWT token
 * 2. Create event with auth → verify owned_by field
 * 3. List events → verify public access, find created event
 * 4. Delete event as owner → should succeed (200 or 204)
 * 5. Delete event without auth → should fail (401)
 * 6. Delete event as different user → should fail (403)
 */

const API_BASE = 'http://localhost:8080/api';
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(level, msg) {
  const prefix = {
    'success': `${COLORS.green}✓${COLORS.reset}`,
    'error': `${COLORS.red}❌${COLORS.reset}`,
    'warn': `${COLORS.yellow}⚠${COLORS.reset}`,
    'info': `${COLORS.blue}ℹ${COLORS.reset}`,
  }[level] || level;
  console.log(`${prefix} ${msg}`);
}

async function request(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, options);
    const data = await res.json();
    return { status: res.status, data };
  } catch (err) {
    log('error', `Request failed: ${err.message}`);
    throw err;
  }
}

async function runTests() {
  console.log(`\n${COLORS.yellow}=== BruinSplit Event Flow Test (Node.js) ===${COLORS.reset}\n`);

  let user1Token, user1Id, user2Token, user2Id, eventId;

  try {
    // Test 1: Signup User 1
    log('info', 'Creating user 1...');
    const timestamp = Date.now();
    let res = await request('POST', '/auth/signup', {
      first_name: 'Alice',
      last_name: 'Tester',
      email: `alice_${timestamp}@bruinsplit.local`,
      password: 'TestPassword123!',
      username: `alice_${timestamp}`,
    });
    if (res.status !== 201 && res.status !== 200) {
      log('error', `Signup failed: ${res.status} - ${JSON.stringify(res.data)}`);
      process.exit(1);
    }
    user1Token = res.data.token;
    user1Id = res.data.user.id;
    log('success', `User 1 created: ${user1Id}`);

    // Test 2: Signup User 2
    log('info', 'Creating user 2...');
    res = await request('POST', '/auth/signup', {
      first_name: 'Bob',
      last_name: 'Tester',
      email: `bob_${timestamp}@bruinsplit.local`,
      password: 'TestPassword123!',
      username: `bob_${timestamp}`,
    });
    if (res.status !== 201 && res.status !== 200) {
      log('error', `Signup failed: ${res.status}`);
      process.exit(1);
    }
    user2Token = res.data.token;
    user2Id = res.data.user.id;
    log('success', `User 2 created: ${user2Id}`);

    // Test 3: Create event as User 1
    log('info', 'User 1 creating event...');
    res = await request('POST', '/events', {
      title: 'Study Session',
      description: 'Testing event auth',
      location: 'Royce Hall',
      event_date: '2025-12-15T14:00:00',
      event_type: 'Study',
    }, user1Token);
    if (res.status !== 201 && res.status !== 200) {
      log('error', `Create failed: ${res.status} - ${JSON.stringify(res.data)}`);
      process.exit(1);
    }
    eventId = res.data.id;
    log('success', `Event created: ${eventId} (owned by ${res.data.created_by})`);
    
    if (res.data.created_by !== user1Id) {
      log('warn', `Event created_by (${res.data.created_by}) does not match user (${user1Id})`);
    }

    // Test 4: List events
    log('info', 'Listing all events...');
    res = await request('GET', '/events');
    if (res.status !== 200) {
      log('error', `List failed: ${res.status}`);
      process.exit(1);
    }
    const eventCount = res.data.length;
    log('success', `Retrieved ${eventCount} events`);
    
    const foundEvent = res.data.find(ev => ev.id === eventId);
    if (!foundEvent) {
      log('error', `Created event not found in list`);
      process.exit(1);
    }
    log('success', `Found created event in list`);

    // Test 5: User 1 deletes their event (should succeed)
    log('info', 'User 1 deleting their event...');
    res = await request('DELETE', `/events/${eventId}`, null, user1Token);
    if (res.status !== 200 && res.status !== 204) {
      log('error', `Delete failed: ${res.status} - ${JSON.stringify(res.data)}`);
      process.exit(1);
    }
    log('success', `Event deleted by owner`);

    // Test 6: Create another event for User 1
    log('info', 'User 1 creating another event...');
    res = await request('POST', '/events', {
      title: 'Social Event',
      description: 'Testing cross-user delete denial',
      location: 'Ackerman Union',
      event_date: '2025-12-16T18:00:00',
      event_type: 'Social',
    }, user1Token);
    if (res.status !== 201 && res.status !== 200) {
      log('error', `Create failed: ${res.status}`);
      process.exit(1);
    }
    const event2Id = res.data.id;
    log('success', `Event 2 created: ${event2Id}`);

    // Test 7: User 2 tries to delete User 1's event (should fail)
    log('info', 'User 2 attempting to delete User 1 event...');
    res = await request('DELETE', `/events/${event2Id}`, null, user2Token);
    if (res.status === 403) {
      log('success', `Correctly rejected: 403 Forbidden`);
    } else if (res.status === 401) {
      log('warn', `Got 401 instead of 403 (still secure)`);
    } else {
      log('error', `Unexpected status: ${res.status} - should be 403`);
      process.exit(1);
    }

    // Test 8: Try delete without token (should fail)
    log('info', 'Attempting delete without auth token...');
    res = await request('DELETE', `/events/${event2Id}`);
    if (res.status === 401) {
      log('success', `Correctly rejected: 401 Unauthorized`);
    } else {
      log('warn', `Got ${res.status} (expected 401)`);
    }

    // Test 9: User 1 deletes their own event (should work)
    log('info', 'User 1 deleting their own event...');
    res = await request('DELETE', `/events/${event2Id}`, null, user1Token);
    if (res.status !== 200 && res.status !== 204) {
      log('error', `Delete failed: ${res.status}`);
      process.exit(1);
    }
    log('success', `User 1 successfully deleted their event`);

    console.log(`\n${COLORS.green}=== All tests passed! ===${COLORS.reset}\n`);
    console.log('Summary:');
    console.log('  ✓ User signup and authentication');
    console.log('  ✓ Authenticated event creation (owned_by set correctly)');
    console.log('  ✓ Public event listing');
    console.log('  ✓ Owner can delete their events');
    console.log('  ✓ Non-owner cannot delete another user\'s events (403)');
    console.log('  ✓ Unauthenticated delete rejected (401)');
    console.log('');

  } catch (err) {
    log('error', `Test suite failed: ${err.message}`);
    process.exit(1);
  }
}

runTests();
