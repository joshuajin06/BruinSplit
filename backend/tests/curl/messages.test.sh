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
# ./messages.test.sh http://localhost:8080/api "your-token-here"
#
# or with default values:
# ./messages.test.sh
################################################################################

# curl tests for messages API - JSON schema validation
# these tests have been tested on a testing branch through development along request/response JSON structures during development
# usage: ./messages.test.sh [BASE_URL] [AUTH_TOKEN]
# merge: after we finish web app


BASE_URL="${1:-http://localhost:8080/api}"
TOKEN="${2:-}"

echo "=== messages API JSON schema tests ==="
echo ""

# test 1: POST /api/messages - valid request schema
echo "test 1: post message - valid JSON schema"
RESPONSE=$(curl -s -X POST "${BASE_URL}/messages" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "ride_id": "test-ride-id",
    "content": "bro justin meet me at hedrick"
  }')

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# test 2: POST /api/messages - missing ride_id
echo "test 2: post message - missing ride_id"
RESPONSE=$(curl -s -X POST "${BASE_URL}/messages" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Test message"
  }')

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# test 3: POST /api/messages - missing content
echo "test 3: post message - missing content"
RESPONSE=$(curl -s -X POST "${BASE_URL}/messages" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "ride_id": "test-ride-id"
  }')

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# test 4: POST /api/messages - empty content
echo "test 4: post message - empty content"
RESPONSE=$(curl -s -X POST "${BASE_URL}/messages" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "ride_id": "test-ride-id",
    "content": "   "
  }')

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# test 5: GET /api/messages - response schema with query param
echo "test 5: get messages - response schema"
RESPONSE=$(curl -s -X GET "${BASE_URL}/messages?ride_id=test-ride-id" \
  -H "Authorization: Bearer ${TOKEN}")
echo "$RESPONSE" | jq '.messages[0]' 2>/dev/null || echo "$RESPONSE"
echo ""


# test 6: GET /api/messages - missing ride_id query param
echo "test 6: get messages - missing ride_id"
RESPONSE=$(curl -s -X GET "${BASE_URL}/messages" \
  -H "Authorization: Bearer ${TOKEN}")
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""


# test 7: GET /api/messages/conversations - response schema
echo "test 7: get conversations - response schema"
RESPONSE=$(curl -s -X GET "${BASE_URL}/messages/conversations" \
  -H "Authorization: Bearer ${TOKEN}")
echo "$RESPONSE" | jq '.conversations[0]' 2>/dev/null || echo "$RESPONSE"
echo ""

echo "=== tests complete ==="