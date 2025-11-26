#!/bin/bash
set -e

# Get portable ISO timestamp
CURRENTDATE=$(date --iso-8601=seconds 2>/dev/null || date -u +"%Y-%m-%dT%H:%M:%SZ")

BASE_URL="http://localhost:8080/api/events"

echo "======= CREATE EVENT ======="
CREATE_RESPONSE=$(curl -s -X POST $BASE_URL \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Career Fair That's Not Hiring\",
    \"description\": \"Initial description\",
    \"location\": \"Ackerman Grand Ballroom\",
    \"event_date\": \"${CURRENTDATE}\",
    \"event_type\": \"Social\"
  }")

echo "$CREATE_RESPONSE" | jq .

EVENT_ID=$(echo "$CREATE_RESPONSE" | jq -r '.id')

if [[ -z "$EVENT_ID" || "$EVENT_ID" == "null" ]]; then
    echo "ERROR: Could not extract event ID!"
    exit 1
fi

echo "Created event with ID: $EVENT_ID"


echo "======= UPDATE EVENT ======="
UPDATE_RESPONSE=$(curl -s -X PUT $BASE_URL/$EVENT_ID \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Updated Event Title\",
    \"description\": \"Updated description goes here\",
    \"location\": \"Kerckhoff Hall\",
    \"event_date\": \"${CURRENTDATE}\",
    \"event_type\": \"UpdatedType\"
  }")

echo "$UPDATE_RESPONSE" | jq .


echo "======= VERIFY UPDATE ======="
VERIFY_RESPONSE=$(curl -s $BASE_URL/$EVENT_ID)
echo "$VERIFY_RESPONSE" | jq .

UPDATED_TITLE=$(echo "$VERIFY_RESPONSE" | jq -r '.title')

if [[ "$UPDATED_TITLE" != "Updated Event Title" ]]; then
    echo "ERROR: Update did NOT go through!"
    exit 1
fi

echo "Verified update successfully."


echo "======= DELETE EVENT ======="
DELETE_RESPONSE=$(curl -s -X DELETE $BASE_URL/$EVENT_ID)
echo "$DELETE_RESPONSE" | jq .


echo "======= CONFIRM DELETION ======="
FINAL_CHECK=$(curl -s $BASE_URL | jq --arg id "$EVENT_ID" 'map(select(.id == $id))')

if [[ "$FINAL_CHECK" != "[]" ]]; then
    echo "ERROR: Event was not deleted!"
    exit 1
fi

echo "Event successfully deleted and confirmed."
