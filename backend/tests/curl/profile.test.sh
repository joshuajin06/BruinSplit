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
# ./profile.test.sh http://localhost:8080/api "your-token-here"
#
# or with default values:
# ./profile.test.sh
################################################################################

# curl tests for profile API - JSON schema validation
# these tests have been tested on a testing branch through development along request/response JSON structures during development
# usage: ./profile.test.sh [BASE_URL] [AUTH_TOKEN]
# merge: after we finish web app


BASE_URL="${1:-http://localhost:8080/api}"
TOKEN="${2:-}"

echo "=== profile API JSON schema tests ==="
echo ""

# test 1: GET /api/profile/me - get own profile response schema
echo "test 1: get own profile - response schema"
RESPONSE=$(curl -s -X GET "${BASE_URL}/profile/me" \
  -H "Authorization: Bearer ${TOKEN}")
echo "$RESPONSE" | jq '.profile' 2>/dev/null || echo "$RESPONSE"
echo ""

# test 2: GET /api/profile/:userId - get user profile response schema
echo "test 2: get user profile by ID - response schema"
USER_ID="test-user-id"
RESPONSE=$(curl -s -X GET "${BASE_URL}/profile/${USER_ID}")
echo "$RESPONSE" | jq '.profile' 2>/dev/null || echo "$RESPONSE"
echo ""

# test 3: PUT /api/profile/me - update profile valid JSON schema
echo "test 3: update profile - valid JSON schema"
RESPONSE=$(curl -s -X PUT "${BASE_URL}/profile/me" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Anish",
    "last_name": "Kumar",
    "username": "anish_kumar"
  }')

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# test 4: PUT /api/profile/me - update with phone number
echo "test 4: update profile - phone number schema"
RESPONSE=$(curl -s -X PUT "${BASE_URL}/profile/me" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "9093553535"
  }')

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# test 5: PUT /api/profile/me - invalid username (too short)
echo "test 5: update profile - invalid username length"
RESPONSE=$(curl -s -X PUT "${BASE_URL}/profile/me" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ab"
  }')

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# test 6: PUT /api/profile/me - invalid username (special characters)
echo "test 6: update profile - invalid username characters"
RESPONSE=$(curl -s -X PUT "${BASE_URL}/profile/me" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "justin-luc!"
  }')

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# test 7: PUT /api/profile/me - invalid phone number
echo "test 7: update profile - invalid phone number"
RESPONSE=$(curl -s -X PUT "${BASE_URL}/profile/me" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "phone_number": "355"
  }')

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# test 8: PUT /api/profile/me - empty first name
echo "test 8: update profile - empty first name"
RESPONSE=$(curl -s -X PUT "${BASE_URL}/profile/me" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "   "
  }')

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# test 9: PUT /api/profile/me - no fields provided
echo "test 9: update profile - no fields provided"
RESPONSE=$(curl -s -X PUT "${BASE_URL}/profile/me" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{}')

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

echo "=== tests complete ==="