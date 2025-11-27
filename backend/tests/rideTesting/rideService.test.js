import { supabase } from '../../src/supabase.js';

import { createRide } from '../../src/services/rideService.js';

import { joinRide } from '../../src/services/rideService.js';


// mock supabase
jest.mock('../../src/supabase.js', () => ({
    supabase: {
        from: jest.fn()
    }
}));

/* ADD MORE EDGE CASE TESTING */
describe('createRide', () => {

    // resets mocks before each test
    beforeEach( () => {
        jest.clearAllMocks();
    });

    it('should sucessfully create a ride with valid data', async () => {

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

        // mock the supabase chain
        const mockSingle = jest.fn().mockResolvedValue({
            data: mockRideFromDB,
            error: null
        });
        const mockSelect = jest.fn().mockReturnValue({
            single: mockSingle
        });
        const mockInsert = jest.fn().mockReturnValue({
            select: mockSelect
        });

        supabase.from.mockReturnValue({
            insert: mockInsert
        });

        // call the function
        const result = await createRide(rideData);

        // check the result matches what the databasse returns
        expect(result).toHaveProperty('id');
        expect(result.owner_id).toBe('3535');
        expect(result.origin_text).toBe('UCLA Sproul Crosswalk');
        expect(result.destination_text).toBe('LAX');
        expect(result.platform).toBe('UBER');
        expect(result.max_seats).toBe(4);
        expect(result.notes).toBe('Testing ride creation');

        // verify supabase was called correctly
        expect(supabase.from).toHaveBeenCalledWith('rides');
        expect(mockInsert).toHaveBeenCalledWith([{
            owner_id: '3535',
            origin_text: 'UCLA Sproul Crosswalk',
            destination_text: 'LAX',
            depart_at: rideData.departAt,
            platform: 'UBER',
            max_seats: 4,
            notes: 'Testing ride creation'
        }]);
    })

    it('should throw error when database insert fais', async () => {

        // set up test data
        const rideData = {
            owner_id: '3535',
            origin_text: 'UCLA Sproul Crosswalk',
            destination_text: 'LAX',
            departAt: new Date('2025-12-11T10:00:00Z'),
            platformUpper: 'UBER',
            maxSeats: 4,
            notes: 'Testing ride deletion'
        };

        // mock - database returns error
        const mockSingle = jest.fn().mocklResolvedValue({
            data: null,
            error: { message: 'Database constraint violation' }
        });
        const mockSelect = jest.fn().mockReturnValue({
            single: mockSingle
        });
        const mockInsert = jest.fn().mockReturnValue({
            select: mockSelect
        });

        supabase.from.mockReturnValue({
            insert: mockInsert
        });

        await expect(createRide(rideData)).rejects.toThrow();
    })

});



/* *****  TODO AFTER IMPLEMENTATION **** 
describe('joinRide', () => {

    beforeEach( () => {
        jest.clearAllMocks();
    });

    it('should add user to a ride when the ride has available seats', async () => {
        // setting up the test data
        const rideId = 'ride-3535';
        const userId = 'user-3535';

        // this is a mock - check if the ride exists 
        const mockRide = {
            id: rideId,
            max_seats: 4,
            owner_id: 'owner-3535'
        };

        // mock - the ride has 2 members, so user should be able to join
        const mockMemberCount = { count: 2, error: null };

        // mock - check if user has already joined the ride (should return null - not joined)
        const mockExistingMember = { data: null, error: null };

        // mock - insert new member
        const mockNewMember = {
            id: 'member-3535',
            ride_id: rideId,
            user_id: userId,
            status: 'CONFIRMED JOINING',
            joined_at: new Date()
        };

        setupSupabaseMocks({
            ride: mockRide,
            memberCount: mockMemberCount,
            existingMember: mockExistingMember,
            newMember: newMember
        });

        const result = await joinRide(rideId, userId);

        expect(result.ride_id).toBe(rideId);
        expecr(result.user_id).toBe(userId);
        expect(result.status).toBe('CONFIRMED JOINING');
    });



    it('should throw error when ride is full', async () => {



    });

});
*/
