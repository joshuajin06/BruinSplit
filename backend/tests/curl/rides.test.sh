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
# ./rides.test.sh http://localhost:8080/api "your-token-here"
#
# or with default values:
# ./rides.test.sh
################################################################################

# curl tests for rides API - JSON schema validation
# these tests have been tested on a testing branch through development along request/response JSON structures during development
# usage: ./rides.test.sh [BASE_URL] [AUTH_TOKEN]
# merge: after we finish web app

BASE_URL="${1:-http://localhost:8080/api}"
TOKEN="${2:-}"

echo "=== rides API JSON schema tests ==="
echo ""

# test 1: POST /api/rides - valid request schema
echo "test 1: create ride - valid JSON schema"
RESPONSE=$(curl -s -X POST "${BASE_URL}/rides" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "origin_text": "UCLA",
    "destination_text": "LAX",
    "depart_at": "2025-12-15T14:00:00Z",
    "platform": "UBER",
    "max_seats": 4,
    "notes": "finals week ride"
  }')

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# test 2: POST /api/rides - missing required field (origin_text)
echo "test 2: create ride - missing origin_text"
RESPONSE=$(curl -s -X POST "${BASE_URL}/rides" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "destination_text": "LAX",
    "depart_at": "2025-12-15T14:00:00Z",
    "platform": "UBER",
    "max_seats": 4
  }')

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# test 3: POST /api/rides - invalid platform value
echo "test 3: create ride - invalid platform"
RESPONSE=$(curl -s -X POST "${BASE_URL}/rides" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "origin_text": "UCLA",
    "destination_text": "LAX",
    "depart_at": "2025-12-15T14:00:00Z",
    "platform": "INVALID_PLATFORM",
    "max_seats": 4
  }')

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# test 4: POST /api/rides - invalid max_seats (out of range)
echo "test 4: create ride - invalid max_seats"
RESPONSE=$(curl -s -X POST "${BASE_URL}/rides" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "origin_text": "UCLA",
    "destination_text": "LAX",
    "depart_at": "2025-12-15T14:00:00Z",
    "platform": "UBER",
    "max_seats": 10
  }')

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# test 5: GET /api/rides - response schema
echo "test 5: get all rides - response schema"
RESPONSE=$(curl -s -X GET "${BASE_URL}/rides")
echo "$RESPONSE" | jq '.rides[0]' 2>/dev/null || echo "$RESPONSE"
echo ""

# test 6: GET /api/rides/:id - response schema
echo "test 6: get ride by ID - response schema"
RIDE_ID="test-ride-id"  # replace with actual ID when testing
RESPONSE=$(curl -s -X GET "${BASE_URL}/rides/${RIDE_ID}")
echo "$RESPONSE" | jq '.ride' 2>/dev/null || echo "$RESPONSE"
echo ""

# test 7: PUT /api/rides/:id - update request schema
echo "test 7: update ride - valid JSON schema"
RIDE_ID="test-ride-id"
RESPONSE=$(curl -s -X PUT "${BASE_URL}/rides/${RIDE_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "origin_text": "UCLA",
    "notes": "Justin is bye bye"
  }')

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# test 8: POST /api/rides/:id/join - response schema
echo "test 8: join ride - response schema"
RIDE_ID="test-ride-id"
RESPONSE=$(curl -s -X POST "${BASE_URL}/rides/${RIDE_ID}/join" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json")

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

echo "=== tests complete ==="