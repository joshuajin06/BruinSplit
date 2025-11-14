import express from 'express';
import { supabase } from '../src/lib/supabase.js';

const router = express.Router();

// Create a new ride
router.post('/', async (req, res) => {
	try {
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
					depart_at,
					platform: platform || null,
					max_seats: max_seats || null,
					notes: notes || null,
				},
			])
			.select()
			.limit(1);

		if (error) {
			console.error('Error creating ride:', error);
			return res.status(500).json({ error: 'Error creating ride' });
		}

		return res.status(201).json({ ride: data && data[0] ? data[0] : data });
	} catch (err) {
		console.error('Unexpected error creating ride:', err);
		return res.status(500).json({ error: 'Unexpected server error' });
	}
});

// List rides (optionally filter by owner_id)
router.get('/', async (req, res) => {
	try {
		const { owner_id } = req.query;

		let query = supabase.from('rides').select('*');
		if (owner_id) query = query.eq('owner_id', owner_id);

		const { data, error } = await query.order('depart_at', { ascending: true });

		if (error) {
			console.error('Error listing rides:', error);
			return res.status(500).json({ error: 'Error listing rides' });
		}

		return res.status(200).json({ rides: data });
	} catch (err) {
		console.error('Unexpected error listing rides:', err);
		return res.status(500).json({ error: 'Unexpected server error' });
	}
});

// Get a single ride by id
router.get('/:id', async (req, res) => {
	try {
		const { id } = req.params;
		if (!id) return res.status(400).json({ error: 'Missing ride id' });

		const { data, error } = await supabase.from('rides').select('*').eq('id', id).single();

		if (error) {
			console.error('Error fetching ride:', error);
			return res.status(500).json({ error: 'Error fetching ride' });
		}

		if (!data) return res.status(404).json({ error: 'Ride not found' });

		return res.status(200).json({ ride: data });
	} catch (err) {
		console.error('Unexpected error fetching ride:', err);
		return res.status(500).json({ error: 'Unexpected server error' });
	}
});

export default router;

