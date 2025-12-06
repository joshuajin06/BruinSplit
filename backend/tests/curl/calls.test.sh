#!/bin/bash

################################################################################
# how to use these tests:
#
# step 1: get an authentication token
# first, signup (if you don't have a test user):
# curl -X POST http://localhost:8080/api/auth/signup \
#   -H "Content-Type: application/json" \
#   -d '{
#     "email": "test@example.com",
#     "username": "testuser",
#     "password": "TestPassword123",
#     "first_name": "Anish",
#     "last_name": "Kumar"
#   }'
#
# then login to get token:
# curl -X POST http://localhost:8080/api/auth/login \
#   -H "Content-Type: application/json" \
#   -d '{
#     "email": "test@example.com",
#     "password": "TestPassword123"
#   }'
#
# step 2: run this test file
# ./calls.test.sh http://localhost:8080/api "your-token-here"
#
# or with default values:
# ./calls.test.sh
################################################################################

# curl tests for calls API - JSON schema validation
# these tests have been tested on a testing branch through development along request/response JSON structures during development
# usage: ./calls.test.sh [BASE_URL] [AUTH_TOKEN]
# merge: after we finish web app


BASE_URL="${1:-http://localhost:8080/api}"
TOKEN="${2:-}"

echo "=== calls API JSON schema tests ==="
echo ""

# test 1: POST /api/calls/:rideId/join - join call response schema
echo "test 1: join call - response schema"
RIDE_ID="test-ride-id"
RESPONSE=$(curl -s -X POST "${BASE_URL}/calls/${RIDE_ID}/join" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json")

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# test 2: POST /api/calls/:rideId/offer/:targetUserId - send offer valid JSON schema
echo "test 2: send offer - valid JSON schema"
RIDE_ID="test-ride-id"
TARGET_USER_ID="test-user-id"
RESPONSE=$(curl -s -X POST "${BASE_URL}/calls/${RIDE_ID}/offer/${TARGET_USER_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "offer": {
      "type": "offer",
      "sdp": "v=0\r\no=- 123456789 2 IN IP4 127.0.0.1\r\n..."
    }
  }')

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# test 3: POST /api/calls/:rideId/offer/:targetUserId - missing offer
echo "test 3: send offer - missing offer"
RIDE_ID="test-ride-id"
TARGET_USER_ID="test-user-id"
RESPONSE=$(curl -s -X POST "${BASE_URL}/calls/${RIDE_ID}/offer/${TARGET_USER_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{}')

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# test 4: POST /api/calls/:rideId/answer/:targetUserId - send answer valid JSON schema
echo "test 4: send answer - valid JSON schema"
RIDE_ID="test-ride-id"
TARGET_USER_ID="test-user-id"
RESPONSE=$(curl -s -X POST "${BASE_URL}/calls/${RIDE_ID}/answer/${TARGET_USER_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "answer": {
      "type": "answer",
      "sdp": "v=0\r\no=- 987654321 2 IN IP4 127.0.0.1\r\n..."
    }
  }')

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# test 5: POST /api/calls/:rideId/answer/:targetUserId - missing answer
echo "test 5: send answer - missing answer"
RIDE_ID="test-ride-id"
TARGET_USER_ID="test-user-id"
RESPONSE=$(curl -s -X POST "${BASE_URL}/calls/${RIDE_ID}/answer/${TARGET_USER_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{}')

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# test 6: POST /api/calls/:rideId/ice-candidate/:targetUserId - send ICE candidate valid JSON schema
echo "test 6: send ICE candidate - valid JSON schema"
RIDE_ID="test-ride-id"
TARGET_USER_ID="test-user-id"
RESPONSE=$(curl -s -X POST "${BASE_URL}/calls/${RIDE_ID}/ice-candidate/${TARGET_USER_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "candidate": {
      "candidate": "candidate:1 1 UDP 2130706431 192.168.1.1 54321 typ host",
      "sdpMLineIndex": 0,
      "sdpMid": "0"
    }
  }')

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# test 7: POST /api/calls/:rideId/ice-candidate/:targetUserId - missing candidate
echo "test 7: send ICE candidate - missing candidate"
RIDE_ID="test-ride-id"
TARGET_USER_ID="test-user-id"
RESPONSE=$(curl -s -X POST "${BASE_URL}/calls/${RIDE_ID}/ice-candidate/${TARGET_USER_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{}')

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# test 8: GET /api/calls/:rideId/status - get call status response schema
echo "test 8: get call status - response schema"
RIDE_ID="test-ride-id"
RESPONSE=$(curl -s -X GET "${BASE_URL}/calls/${RIDE_ID}/status" \
  -H "Authorization: Bearer ${TOKEN}")
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# test 9: GET /api/calls/:rideId/info - get call info response schema
echo "test 9: get call info - response schema"
RIDE_ID="test-ride-id"
RESPONSE=$(curl -s -X GET "${BASE_URL}/calls/${RIDE_ID}/info" \
  -H "Authorization: Bearer ${TOKEN}")
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# test 10: DELETE /api/calls/:rideId/leave - leave call response schema
echo "test 10: leave call - response schema"
RIDE_ID="test-ride-id"
RESPONSE=$(curl -s -X DELETE "${BASE_URL}/calls/${RIDE_ID}/leave" \
  -H "Authorization: Bearer ${TOKEN}")
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

echo "=== tests complete ==="