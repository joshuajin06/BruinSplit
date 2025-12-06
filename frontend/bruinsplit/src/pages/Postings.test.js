import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import Postings from './Postings';
import { AuthContext } from '../context/AuthContext';
import * as ridesApi from './api/rides';
import * as friendsApi from './api/friends';

// Mock API modules
jest.mock('./api/rides');
jest.mock('./api/friends');
// Mock fetch
global.fetch = jest.fn();


// Mock child components
jest.mock('../components/card', () => (props) => <div data-testid="ride-card">{props.origin} to {props.destination}</div>);
jest.mock('../components/searchBar', () => ({ onSearch, initialValue }) => (
  <input
    data-testid="search-bar"
    onChange={(e) => onSearch(e.target.value)}
    defaultValue={initialValue}
  />
));

const mockUser = { id: 1, name: 'Test User' };

const allRides = [
  { id: 101, owner_id: 2, origin_text: 'UCLA', destination_text: 'LAX', owner: { first_name: 'Friend' } },
  { id: 102, owner_id: 3, origin_text: 'UCLA', destination_text: 'Santa Monica', owner: { first_name: 'Stranger' } },
  { id: 103, owner_id: 1, origin_text: 'Home', destination_text: 'UCLA' }, // User's own ride
];
const myRides = { rides: [{ id: 103 }] };
const friends = { friends: [{ id: 2 }] };

const renderPostings = (authValue, initialEntries = ['/postings']) => {
  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={initialEntries}>
        <Postings />
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('Postings Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ridesApi.getRides.mockResolvedValue({ rides: allRides });
    ridesApi.getMyRides.mockResolvedValue(myRides);
    friendsApi.getFriends.mockResolvedValue(friends);
    fetch.mockClear();
  });

  describe('Unauthenticated User', () => {
    test('does not show post button or friends filter', async () => {
      renderPostings({ isAuthenticated: false, user: null });
      await waitFor(() => {
        expect(screen.getByText('UCLA to LAX')).toBeInTheDocument();
      });
      expect(screen.queryByText('+')).not.toBeInTheDocument();
      expect(screen.queryByText(/see what your friends are up to/i)).not.toBeInTheDocument();
    });
  });

  describe('Authenticated User', () => {
    test('shows post button and friends filter', async () => {
      renderPostings({ isAuthenticated: true, user: mockUser });
      await waitFor(() => {
        expect(screen.getByText('UCLA to LAX')).toBeInTheDocument();
      });
      expect(screen.getByText('+')).toBeInTheDocument();
      expect(screen.getByText(/see what your friends are up to/i)).toBeInTheDocument();
    });

    test('displays available rides, filtering out user\'s own rides', async () => {
        renderPostings({ isAuthenticated: true, user: mockUser });
        await waitFor(() => {
            expect(ridesApi.getRides).toHaveBeenCalled();
            expect(ridesApi.getMyRides).toHaveBeenCalled();
        });
        
        expect(screen.getByText('UCLA to LAX')).toBeInTheDocument();
        expect(screen.getByText('UCLA to Santa Monica')).toBeInTheDocument();
        expect(screen.queryByText('Home to UCLA')).not.toBeInTheDocument();
    });

    test('filters rides based on search input', async () => {
        renderPostings({ isAuthenticated: true, user: mockUser }, ['/postings?q=Santa']);
        await waitFor(() => {
            expect(screen.getByText('UCLA to Santa Monica')).toBeInTheDocument();
        });
        expect(screen.queryByText('UCLA to LAX')).not.toBeInTheDocument();
    });

    test('filters rides to show only friends\' rides', async () => {
        renderPostings({ isAuthenticated: true, user: mockUser });
        await waitFor(() => {
            expect(screen.getByText('UCLA to LAX')).toBeInTheDocument();
            expect(screen.getByText('UCLA to Santa Monica')).toBeInTheDocument();
        });

        const friendsFilterButton = screen.getByText(/see what your friends are up to/i);
        fireEvent.click(friendsFilterButton);

        await waitFor(() => {
            expect(screen.getByText('UCLA to LAX')).toBeInTheDocument();
            expect(screen.queryByText('UCLA to Santa Monica')).not.toBeInTheDocument();
        });
    });

    describe('Create Ride Modal', () => {
        beforeEach(() => {
            // Mock successful auto-join
            fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({}),
            });
        });
        
        test('opens and closes the modal', async () => {
            renderPostings({ isAuthenticated: true, user: mockUser });
            await waitFor(() => {
                expect(screen.getByText('+')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText('+'));
            await waitFor(() => {
                expect(screen.getByRole('heading', { name: 'Create Ride' })).toBeInTheDocument();
            });

            fireEvent.click(screen.getByLabelText('Close modal'));
            await waitFor(() => {
                expect(screen.queryByRole('heading', { name: 'Create Ride' })).not.toBeInTheDocument();
            });
        });
        
        test('shows validation error for empty required fields', async () => {
            renderPostings({ isAuthenticated: true, user: mockUser });
            await waitFor(() => {
                fireEvent.click(screen.getByText('+'));
            });

            fireEvent.click(screen.getByRole('button', { name: 'Create' }));

            await waitFor(() => {
                expect(screen.getByText('Please provide origin, destination and departure time')).toBeInTheDocument();
            });
        });

        test('handles successful ride creation', async () => {
            // first call for create, second for auto-join
            fetch
                .mockResolvedValueOnce({ ok: true, json: async () => ({ ride: { id: 104 } }) })
                .mockResolvedValueOnce({ ok: true, json: async () => ({}) });


            renderPostings({ isAuthenticated: true, user: mockUser });
            await waitFor(() => {
                fireEvent.click(screen.getByText('+'));
            });

            // Fill and submit form
            fireEvent.change(screen.getByLabelText('Origin'), { target: { value: 'New Origin' } });
            fireEvent.change(screen.getByLabelText('Destination'), { target: { value: 'New Destination' } });
            fireEvent.change(screen.getByLabelText('Departure'), { target: { value: '2025-12-05T10:00' } });
            
            fireEvent.click(screen.getByRole('button', { name: 'Create' }));

            await waitFor(() => {
                expect(fetch).toHaveBeenCalledWith('/api/rides', expect.any(Object));
                expect(screen.queryByRole('heading', { name: 'Create Ride' })).not.toBeInTheDocument();
            });
            // check that rides are refetched
            expect(ridesApi.getRides).toHaveBeenCalledTimes(2);
        });

        test('handles failed ride creation', async () => {
            const errorMessage = 'Creation failed';
            fetch.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({ error: errorMessage }) });

            renderPostings({ isAuthenticated: true, user: mockUser });
            await waitFor(() => {
                fireEvent.click(screen.getByText('+'));
            });

            fireEvent.change(screen.getByLabelText('Origin'), { target: { value: 'Bad Origin' } });
            fireEvent.change(screen.getByLabelText('Destination'), { target: { value: 'Bad Destination' } });
            fireEvent.change(screen.getByLabelText('Departure'), { target: { value: '2025-12-05T10:00' } });
            fireEvent.click(screen.getByRole('button', { name: 'Create' }));

            await waitFor(() => {
                expect(screen.getByText(errorMessage)).toBeInTheDocument();
            });
            // Modal should remain open
            expect(screen.getByRole('heading', { name: 'Create Ride' })).toBeInTheDocument();
        });
    });
  });
});
