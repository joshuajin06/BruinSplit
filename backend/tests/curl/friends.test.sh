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
# ./friends.test.sh http://localhost:8080/api "your-token-here"
#
# or with default values:
# ./friends.test.sh
################################################################################

# curl tests for friends API - JSON schema validation
# these tests have been tested on a testing branch through development along request/response JSON structures during development
# usage: ./friends.test.sh [BASE_URL] [AUTH_TOKEN]
# merge: after we finish web app


BASE_URL="${1:-http://localhost:8080/api}"
TOKEN="${2:-}"

echo "=== friends API JSON schema tests ==="
echo ""

# test 1: POST /api/friends/request/:userId - send friend request
echo "test 1: send friend request - response schema"
USER_ID="test-user-id"
RESPONSE=$(curl -s -X POST "${BASE_URL}/friends/request/${USER_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json")

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# test 2: POST /api/friends/accept/:userId - accept friend request
echo "test 2: accept friend request - response schema"
USER_ID="test-user-id"
RESPONSE=$(curl -s -X POST "${BASE_URL}/friends/accept/${USER_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json")

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# test 3: POST /api/friends/reject/:userId - reject friend request
echo "test 3: reject friend request - response schema"
USER_ID="test-user-id"
RESPONSE=$(curl -s -X POST "${BASE_URL}/friends/reject/${USER_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json")

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# test 4: GET /api/friends - get all friends response schema
echo "test 4: get friends - response schema"
RESPONSE=$(curl -s -X GET "${BASE_URL}/friends" \
  -H "Authorization: Bearer ${TOKEN}")
echo "$RESPONSE" | jq '.friends[0]' 2>/dev/null || echo "$RESPONSE"
echo ""

# test 5: GET /api/friends/pending - get pending requests response schema
echo "test 5: get pending requests - response schema"
RESPONSE=$(curl -s -X GET "${BASE_URL}/friends/pending" \
  -H "Authorization: Bearer ${TOKEN}")
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# test 6: GET /api/friends/count/:userId - get friend count response schema
echo "test 6: get friend count - response schema"
USER_ID="test-user-id"
RESPONSE=$(curl -s -X GET "${BASE_URL}/friends/count/${USER_ID}")
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# test 7: GET /api/friends/:userId/friends - get user's friends response schema
echo "test 7: get user friends - response schema"
USER_ID="test-user-id"
RESPONSE=$(curl -s -X GET "${BASE_URL}/friends/${USER_ID}/friends")
echo "$RESPONSE" | jq '.friends[0]' 2>/dev/null || echo "$RESPONSE"
echo ""

# test 8: GET /api/friends/:userId/rides - get friend rides response schema
echo "test 8: get friend rides - response schema"
USER_ID="test-user-id"
RESPONSE=$(curl -s -X GET "${BASE_URL}/friends/${USER_ID}/rides" \
  -H "Authorization: Bearer ${TOKEN}")
echo "$RESPONSE" | jq '.rides[0]' 2>/dev/null || echo "$RESPONSE"
echo ""

# test 9: GET /api/friends/rides/upcoming - get upcoming friend rides response schema
echo "test 9: get upcoming friend rides - response schema"
RESPONSE=$(curl -s -X GET "${BASE_URL}/friends/rides/upcoming?days=7" \
  -H "Authorization: Bearer ${TOKEN}")
echo "$RESPONSE" | jq '.rides[0]' 2>/dev/null || echo "$RESPONSE"
echo ""

# test 10: DELETE /api/friends/:userId - remove friend response schema
echo "test 10: remove friend - response schema"
USER_ID="test-user-id"
RESPONSE=$(curl -s -X DELETE "${BASE_URL}/friends/${USER_ID}" \
  -H "Authorization: Bearer ${TOKEN}")
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

echo "=== tests complete ==="