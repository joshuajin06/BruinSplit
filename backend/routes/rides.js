import express from 'express';
import { supabase } from '../src/lib/supabase.js';

const router = express.Router();

// Create a new ride
router.post('/', async (req, res) => {
	try {
		console.log('POST /api/rides body:', req.body);
		const {
			owner_id,
			origin_text,
			origin_lat,
			origin_lon,
			destination_text,
			destination_lat,
			destination_lon,
			depart_at,
			platform,
			max_seats,
			notes,
		} = req.body;

		// minimal required fields
			if (!owner_id || !origin_text || !destination_text || !depart_at) {
				return res.status(400).json({ error: 'Missing required fields: owner_id, origin_text, destination_text, depart_at' });
			}

			// Normalize/validate platform and max_seats to match DB constraints
			const normalizedPlatform = platform || 'OTHER';
			const parsedMaxSeats = typeof max_seats !== 'undefined' && max_seats !== null ? parseInt(max_seats, 10) : 3;
			if (Number.isNaN(parsedMaxSeats) || parsedMaxSeats < 2 || parsedMaxSeats > 6) {
				return res.status(400).json({ error: 'max_seats must be an integer between 2 and 6' });
			}

			// Basic owner_id format check (UUID-like) to give clearer error earlier
			if (typeof owner_id !== 'string' || !owner_id.match(/^[0-9a-fA-F-]{36}$/)) {
				return res.status(400).json({ error: 'owner_id must be a valid UUID string' });
			}

		const { data, error } = await supabase
			.from('rides')
			.insert([
				{
					owner_id,
					origin_text,
					origin_lat: origin_lat || null,
					origin_lon: origin_lon || null,
					destination_text,
					destination_lat: destination_lat || null,
					destination_lon: destination_lon || null,
					// ensure depart_at is in a timestamp format expected by Postgres
					depart_at: new Date(depart_at).toISOString(),
					// default platform to 'OTHER' (must match enum public.ride_platform)
					platform: normalizedPlatform,
					max_seats: parsedMaxSeats,
					notes: notes || null,
				},
			])
			.select()
			.limit(1);

		if (error) {
			console.error('Error creating ride:', error);
			// Return Supabase error message for debugging
			return res.status(500).json({ error: error.message || error });
		}

		return res.status(201).json({ ride: data && data[0] ? data[0] : data });
	} catch (err) {
		console.error('Unexpected error creating ride:', err);
		return res.status(500).json({ error: err.message || 'Unexpected server error' });
	}
});

// List rides (optionally filter by owner_id)
router.get('/', async (req, res) => {
	try {
		console.log('GET /api/rides query:', req.query);
		const { owner_id } = req.query;

		let query = supabase.from('rides').select('*');
		if (owner_id) query = query.eq('owner_id', owner_id);

		const { data, error } = await query.order('depart_at', { ascending: true });

		if (error) {
			console.error('Error listing rides:', error);
			return res.status(500).json({ error: error.message || error });
		}

		return res.status(200).json({ rides: data });
	} catch (err) {
		console.error('Unexpected error listing rides:', err);
		return res.status(500).json({ error: err.message || 'Unexpected server error' });
	}
});

// Get a single ride by id
router.get('/:id', async (req, res) => {
	try {
		console.log('GET /api/rides/:id', req.params.id);
		const { id } = req.params;
		if (!id) return res.status(400).json({ error: 'Missing ride id' });

		const { data, error } = await supabase.from('rides').select('*').eq('id', id).single();

		if (error) {
			console.error('Error fetching ride:', error);
			return res.status(500).json({ error: error.message || error });
		}

		if (!data) return res.status(404).json({ error: 'Ride not found' });

		return res.status(200).json({ ride: data });
	} catch (err) {
		console.error('Unexpected error fetching ride:', err);
		return res.status(500).json({ error: err.message || 'Unexpected server error' });
	}
});

export default router;

