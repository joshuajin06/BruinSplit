import './pages.css';
import { useEffect, useState } from 'react';
import EventCard from "../components/eventCard.jsx"

export default function Events() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [modalError, setModalError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    const isAuthenticated = !!user && !!token;

    const handleRemoveEvent = (deletedId) => {
    setEvents(prevEvents => prevEvents.filter(ev => ev.id !== deletedId));
    };

    const [form, setForm] = useState({
        title: '',
        description: '',
        location: '',
        event_date: '', 
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
        setModalError(null);

        // Basic validation
        if (!form.title || !form.event_date) {
            setModalError('Please provide a title and date');
            return;
        }

        // Convert datetime-local value into ISO string accepted by backend
        //const eventDateISO = new Date(form.event_date).toISOString();

        const eventDateRaw = form.event_date;

        const payload = {
            title: form.title,
            description: form.description,
            location: form.location,
            event_date: eventDateRaw,//eventDateISO,
            event_type: form.event_type || 'General'
        };

        try {
            const res = await fetch('/api/events', {
                method: 'POST',
                //Add the current users uid so that the event is tied to them
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
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

            setEvents(prev => {
                const next = [...prev, created];
                // sort by event_date ascending
                next.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
                return next;
            });

            // clear form
            setForm({ title: '', description: '', location: '', event_date: '', event_type: '' });
            setShowModal(false);
        } catch (err) {
            console.error('create event error:', err);
            setError(err.message || 'Failed to create event');
        }
    }

    const currentUser = JSON.parse(localStorage.getItem('user'));

    return (
        <div className="events-page">
           
            <section className='title-section'>
                 <h1>Events</h1>
                {isAuthenticated && <button className='add-event' onClick={() => setShowModal(!showModal)}><a>+</a></button>}
            </section>
        
            <section className="events-list">               
                {loading && <p>Loading events…</p>}
                {error && <p className="error">{error}</p>}
                {!loading && events.length === 0 && <p>No events found.</p>}

                <ul>
                    <div className='event-grid'>
                    {events.map(ev => (
                        <li key={ev.id} className="event-item">
                            <EventCard 
                                title={ev.title} 
                                description={ev.description} 
                                location={ev.location}
                                dateTime={ev.event_date ? new Date(ev.event_date).toLocaleString('en-US', {year: 'numeric', 
                                                                                                            month: 'numeric', 
                                                                                                            day: 'numeric', 
                                                                                                            hour: '2-digit', 
                                                                                                            minute: '2-digit'}) : ''}
                                type={ev.event_type}
                                eventId={ev.id} 
                                createdBy={ev.created_by}
                                currentUserId={currentUser?.id}
                                onDelete={handleRemoveEvent}/>
                        </li>
                    ))}
                    </div>
                </ul>
            </section>  

        {showModal && isAuthenticated && (
            <section className="events-form" onClick={() => setShowModal(false)}>
                
                <form className="modal-content" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
                    <button 
                            className="modal-close" 
                            onClick={() => setShowModal(false)}
                            aria-label="Close modal" 
                            type="button">
                    ×
                    </button>
                    <h2>Create Event</h2>
                    
                    {modalError && <p className="error">{modalError}</p>}
                    
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
                        <button type="button" onClick={() => setForm({ title: '', 
                            description: '', 
                            location: '', 
                            event_date: '', 
                            event_type: '' })}>
                                Reset
                            </button>
                    </div>
                </form>
            </section>)}
        </div>
    );
}