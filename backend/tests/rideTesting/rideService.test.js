import { createRide } from '../../src/services/rideService.js';
import { supabase } from '../../src/supabase.js';

// mock supabase
jest.mock('../../src/supabase.js', () => ({
    supabase: {
        from: jest.fn()
    }
}));

describe('createRide', () => {

    // resets mocks before each test
    beforeEach( () => {
        jest.clearAllMocks();
    });



    it('should create a ride with valid data successfully', async() => {

        // set up test data
        const rideData = {
            owner_id: '3535',
            origin_text: 'UCLA Sproul Crosswalk',
            destination_text: 'LAX',
            departAt: new Date('2025-12-11T10:00:00Z'),
            platformUpper: 'UBER',
            maxSeats: 4,
            notes: 'Testing ride creation'
        };

        // mock supabase response
        supabase.from.mockResolvedValue({
            insert: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                        data: { id: 'ride-3535', ...rideData},
                        error: null
                    })
                })
            })
        });

        // call the function
        const result = await createRide(rideData);

        // check the result 
        expect(result).toHaveProperty('id');
        expect(result.origin_text).toBe('UCLA Sproul Crosswalk');
        expect(result.destination_text).toBe('LAX');
        expect(result.departAt).toBeInstanceOf(Date);
        expect(result.platformUpper).toBe('UBER');
        expect(result.maxSeats).toBe(4);
        expect(result.notes).toBe('Testing ride creation');
        expect(result.owner_id).toBe('3535');
        expect(result.created_at).toBeInstanceOf(Date);
        expect(result.updated_at).toBeInstanceOf(Date);
        expect(result.deleted_at).toBeNull();
    })
});

