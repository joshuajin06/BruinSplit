import './pages.css';
import { useEffect, useState } from 'react';

export default function Events() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [form, setForm] = useState({
        title: '',
        description: '',
        location: '',
        event_date: '', // will hold datetime-local value
        event_type: ''
    });

    useEffect(() => {
        fetchEvents();
    }, []);

    async function fetchEvents() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/events');
            if (!res.ok) {
                // try to read text for debugging (server may return HTML)
                const text = await res.text().catch(() => '');
                throw new Error(`Fetch failed: ${res.status} - ${text.slice(0, 300)}`);
            }

            const contentType = res.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
                const text = await res.text().catch(() => '');
                throw new Error(`Expected JSON but received: ${contentType} \n${text.slice(0, 300)}`);
            }

            const data = await res.json();
            setEvents(data || []);
        } catch (err) {
            console.error('fetchEvents error:', err);
            setError(err.message || 'Failed to load events');
        } finally {
            setLoading(false);
        }
    }

    function handleChange(e) {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);

        // Basic validation
        if (!form.title || !form.event_date) {
            setError('Please provide a title and date');
            return;
        }

        // Convert datetime-local value into ISO string accepted by backend
        const eventDateISO = new Date(form.event_date).toISOString();

        const payload = {
            title: form.title,
            description: form.description,
            location: form.location,
            event_date: eventDateISO,
            event_type: form.event_type || 'General'
        };

        try {
            const res = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const text = await res.text().catch(() => '');
                // try to parse JSON error first
                let parsed = null;
                try { parsed = JSON.parse(text); } catch (_) { /* not JSON */ }
                const message = parsed?.error?.message || parsed?.message || text || `Create failed: ${res.status}`;
                throw new Error(message);
            }

            const contentType = res.headers.get('content-type') || '';
            let created = null;
            if (contentType.includes('application/json')) {
                created = await res.json();
            } else {
                const text = await res.text().catch(() => '');
                throw new Error(`Expected JSON response but got ${contentType}: ${text.slice(0,300)}`);
            }

            // Optimistic UI: append created event to list
            setEvents(prev => {
                const next = [...prev, created];
                // sort by event_date ascending
                next.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
                return next;
            });

            // clear form
            setForm({ title: '', description: '', location: '', event_date: '', event_type: '' });
        } catch (err) {
            console.error('create event error:', err);
            setError(err.message || 'Failed to create event');
        }
    }

    return (
        <div className="events-page">
            <h1>Events</h1>

            <section className="events-list">               
                {loading && <p>Loading events…</p>}
                {error && <p className="error">{error}</p>}
                {!loading && events.length === 0 && <p>No events found.</p>}

                //Map of events
                <ul>
                    {events.map(ev => (
                        <li key={ev.id} className="event-item">
                            <strong>{ev.title}</strong>
                            <div className="meta">
                                <span>{ev.location}</span>
                                <span>{ev.event_type}</span>
                                <span>{ev.event_date ? new Date(ev.event_date).toLocaleString() : ''}</span>
                            </div>
                            {ev.description && <p className="desc">{ev.description}</p>}
                        </li>
                    ))}
                </ul>
            </section>


            //Form to create a new event (Change to a modal)
            <section className="events-form">
                <h2>Create Event</h2>
                <form onSubmit={handleSubmit}>
                    <label>
                        Title
                        <input name="title" value={form.title} onChange={handleChange} />
                    </label>

                    <label>
                        Description
                        <textarea name="description" value={form.description} onChange={handleChange} />
                    </label>

                    <label>
                        Location
                        <input name="location" value={form.location} onChange={handleChange} />
                    </label>

                    <label>
                        Date & Time
                        <input
                            name="event_date"
                            type="datetime-local"
                            value={form.event_date}
                            onChange={handleChange}
                        />
                    </label>

                    <label>
                        Type
                        <input name="event_type" value={form.event_type} onChange={handleChange} placeholder="e.g. Study, Social" />
                    </label>

                    <div className="form-actions">
                        <button type="submit">Create</button>
                        <button type="button" onClick={() => setForm({ title: '', description: '', location: '', event_date: '', event_type: '' })}>Reset</button>
                    </div>
                </form>
            </section>
        </div>
    );
}