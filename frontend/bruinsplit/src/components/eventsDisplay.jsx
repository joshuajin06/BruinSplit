// src/components/Events.js
import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch events from backend
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/events");
        const data = await response.json();
        setEvents(data);
      } catch (err) {
        console.error("Error fetching events:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) return <p>Loading events...</p>;

  return (
    <div>
      <h2>Event Table</h2>
      <table className="border-collapse border border-gray-300 w-full mb-8">
        <thead>
          <tr className="bg-gray-200">
            <th className="border px-4 py-2">Title</th>
            <th className="border px-4 py-2">Date</th>
            <th className="border px-4 py-2">Location</th>
            <th className="border px-4 py-2">Type</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id}>
              <td className="border px-4 py-2">{event.title}</td>
              <td className="border px-4 py-2">
                {new Date(event.event_date).toLocaleString()}
              </td>
              <td className="border px-4 py-2">{event.location}</td>
              <td className="border px-4 py-2">{event.event_type}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Calendar View</h2>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events.map((e) => ({
          title: e.title,
          start: e.event_date,
          description: e.description,
        }))}
        eventClick={(info) => alert(`Event: ${info.event.title}\n${info.event.extendedProps.description}`)}
        height="auto"
      />
    </div>
  );
};

export default Events;
