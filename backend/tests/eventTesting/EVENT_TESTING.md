# Event Testing Guide

## Prerequisites

Both backend and frontend servers must be running:

```bash
# Terminal 1: Backend
cd /home/justinluc/Downloads/BruinSplit/backend
npm run dev:api

# Terminal 2: Frontend
cd /home/justinluc/Downloads/BruinSplit/frontend/bruinsplit
npm run dev

# Terminal 3: Run tests
cd /home/justinluc/Downloads/BruinSplit/backend/tests/eventTesting
```

---

## Option 1: Automated Bash Test

Tests the complete event lifecycle with real users and events.

```bash
chmod +x testEventFlow.sh
./testEventFlow.sh
```

**What it tests:**
- User signup (creates random user each run)
- Authenticated event creation
- Event listing (public, no auth)
- Event deletion (owner)
- Unauthorized delete rejection

**Expected output:**
```
✓ Signup successful
✓ Event created
✓ Events retrieved
✓ Event found in list
✓ Event deleted successfully
✓ Event successfully deleted (not found)
✓ Correctly rejected unauthorized delete (HTTP 401)
=== All tests passed! ===
```

---

## Option 2: Automated Node.js Test

More detailed test with two users to verify cross-user authorization.

```bash
node testEventFlow.js
```

**What it tests:**
- User 1 & User 2 signup
- User 1 creates event
- User 2 tries to delete User 1's event (should fail 403)
- Unauthenticated delete (should fail 401)
- Owner deletion (should succeed)

**Expected output:**
```
✓ User 1 created: <uuid>
✓ User 2 created: <uuid>
✓ Event created: 123 (owned by <uuid>)
✓ Retrieved 5 events
✓ Found created event in list
✓ Event deleted by owner
✓ Correctly rejected: 403 Forbidden
✓ Correctly rejected: 401 Unauthorized
=== All tests passed! ===
```

---

## Option 3: Manual Testing via Browser

### Setup

1. Open `http://localhost:5173` in your browser.
2. Sign up or log in with a test account.
3. Open DevTools → Network tab (to inspect requests).

### Test Flow

#### Create an Event
1. Click the `+` button to open the Create Event modal.
2. Fill in:
   - **Title:** "Test Event"
   - **Description:** "Testing delete authorization"
   - **Location:** "Royce Hall"
   - **Date & Time:** Pick a future date
   - **Type:** "Study"
3. Click **Create**.

**Verify in DevTools:**
- POST request to `/api/events` includes `Authorization: Bearer <token>`
- Response includes `created_by: <your_user_id>`

#### Check Event List
- Refresh the page or wait for the event to appear.
- Your new event should show up in the grid.

#### Try Delete
1. You should see an **`x`** delete button on your event card.
2. Click it.
3. The event should disappear from the list.

**Verify in DevTools:**
- DELETE request includes `Authorization: Bearer <token>`
- Response shows `"message": "Event Deleted"` (status 200)

#### Test as Different User
1. Open a **private/incognito window** or use a different browser profile.
2. Log in as a **different user**.
3. Create an event as the first user (you shouldn't see a delete button).
4. Switch back to the first user and refresh.
5. You should NOT see a delete button on events created by the second user.

---

## Option 4: Manual Testing via cURL

### Step 1: Signup
```bash
TIMESTAMP=$(date +%s)
SIGNUP_RESPONSE=$(curl -s -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d "{
    \"first_name\": \"Test\",
    \"last_name\": \"User\",
    \"email\": \"testuser${TIMESTAMP}@bruinsplit.local\",
    \"password\": \"TestPassword123!\",
    \"username\": \"testuser_${TIMESTAMP}\"
  }")

TOKEN=$(echo $SIGNUP_RESPONSE | jq -r '.token')
USER_ID=$(echo $SIGNUP_RESPONSE | jq -r '.user.id')

echo "Token: $TOKEN"
echo "User ID: $USER_ID"
```

### Step 2: Create an Event
```bash
CREATE_RESPONSE=$(curl -s -X POST http://localhost:8080/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Curl Test Event",
    "description": "Created via curl",
    "location": "Test Location",
    "event_date": "2025-12-20T15:00:00",
    "event_type": "Study"
  }')

EVENT_ID=$(echo $CREATE_RESPONSE | jq -r '.id')
CREATED_BY=$(echo $CREATE_RESPONSE | jq -r '.created_by')

echo "Event ID: $EVENT_ID"
echo "Created by: $CREATED_BY"
```

### Step 3: List Events
```bash
curl -s http://localhost:8080/api/events | jq '.[] | {id, title, created_by}'
```

### Step 4: Delete as Owner (Should Succeed)
```bash
curl -i -X DELETE http://localhost:8080/api/events/$EVENT_ID \
  -H "Authorization: Bearer $TOKEN"
```
**Expected:** `200 OK` with `"message": "Event Deleted"`

### Step 5: Delete Without Auth (Should Fail)
```bash
curl -i -X DELETE http://localhost:8080/api/events/$EVENT_ID
```
**Expected:** `401 Unauthorized` with `"error": "No token provided"`

### Step 6: Delete as Different User (Should Fail)
Create a second user and token, then try:
```bash
curl -i -X DELETE http://localhost:8080/api/events/$EVENT_ID \
  -H "Authorization: Bearer $DIFFERENT_USER_TOKEN"
```
**Expected:** `403 Forbidden` with `"error": "Not authorized to delete this event"`

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **Backend returns 401 "No token provided"** | Frontend is not sending `Authorization` header. Check `eventCard.jsx` includes `headers: { 'Authorization': 'Bearer ...' }` |
| **Backend returns 404 "Event not found"** | Event was already deleted or ID doesn't exist. Verify event ID matches. |
| **Delete button doesn't appear** | Check `Events.jsx` passes `createdBy` and `currentUserId` props. Verify `localStorage.getItem('user').id` matches event's `created_by`. |
| **Delete succeeds but event still appears** | Frontend didn't remove it from state. Check `handleRemoveEvent` is called. |
| **Node test fails at signup** | Backend `/api/auth/signup` may require different fields. Check `backend/src/controllers/authController.js` |
| **Events table is empty** | Either: (1) Supabase RLS policies block inserts, or (2) tests haven't created events yet. Run test script to populate. |

---

## What Each Test Validates

### Bash Script (`testEventFlow.sh`)
- ✓ JWT generation and validation
- ✓ Auth header forwarding
- ✓ `created_by` field set to authenticated user
- ✓ Public event listing (no auth)
- ✓ Owner can delete
- ✓ Unauthenticated delete rejected (401)

### Node Script (`testEventFlow.js`)
- All of above, plus:
- ✓ Cross-user authorization (User 2 cannot delete User 1's event → 403)
- ✓ Supabase backend check (`created_by !== req.user.id` → 403)

### Browser Manual Test
- ✓ Token stored in localStorage
- ✓ Delete button only visible to owner
- ✓ Optimistic UI update (event removed immediately)
- ✓ Error handling on failed delete

---

## Next Steps

After confirming tests pass:

1. **Add RLS Policies** (optional, for extra security):
   - Restrict INSERT: only if `created_by = auth.uid()`
   - Restrict DELETE: only if `created_by = auth.uid()`

2. **Add UI Feedback**:
   - Show error toast if delete fails
   - Show success toast on delete
   - Disable button during delete

3. **Add Edit Event**:
   - PUT route + auth check
   - UI form for editing

4. **Implement Event Filtering**:
   - "My Events" vs. "All Events"
   - "Events I'm Attending"

---

## Quick Reference: HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| **200** | OK | DELETE succeeded |
| **201** | Created | Event created |
| **400** | Bad Request | Missing required fields |
| **401** | Unauthorized | No token or invalid token |
| **403** | Forbidden | User lacks permission (not owner) |
| **404** | Not Found | Event ID doesn't exist |
| **500** | Server Error | Backend exception |
