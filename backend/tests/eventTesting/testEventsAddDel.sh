#!/bin/bash
set -e  # exit if any command fails

echo "======= Creating Event ======="
CREATE_RESPONSE=$(curl -s -X POST http://localhost:8080/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Study Session",
    "description": "CS 35L homework meetup",
    "location": "Young Library",
    "event_date": "2025-01-01T15:00:00",
    "event_type": "Academic"
  }')

echo "Response:"
echo "$CREATE_RESPONSE" | jq .

# Extract the event ID
EVENT_ID=$(echo "$CREATE_RESPONSE" | jq -r '.id')

if [ "$EVENT_ID" = "null" ] || [ -z "$EVENT_ID" ]; then
  echo "ERROR: Event ID not returned!"
  exit 1
fi

echo "Created event with ID: $EVENT_ID"


echo "======= Deleting Event ======="
DELETE_RESPONSE=$(curl -s -X DELETE http://localhost:8080/api/events/$EVENT_ID)

echo "Delete Response:"
echo "$DELETE_RESPONSE" | jq .


echo "======= Confirming Delete ======="
curl -s http://localhost:8080/api/events | jq .
