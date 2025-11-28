const URL = "http://localhost:8080/api/events";

async function testCreateEvent() {
  const eventData = {
    title: "Test Event No Auth",
    description: "Created without JWT",
    location: "UCLA",
    event_date: "2025-12-01T18:00:00.000Z",
    event_type: "Go Bruins"
  };

  try {
    const response = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventData)
    });

    const data = await response.json();
    console.log("Response from server:", data);

  } catch (err) {
    console.error("Error:", err);
  }
}

testCreateEvent();
