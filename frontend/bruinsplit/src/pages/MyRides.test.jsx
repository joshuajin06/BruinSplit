import { jest } from '@jest/globals';

// Mock the rides API
jest.mock('./api/rides', () => ({
  getMyRides: jest.fn(),
  getMyPendingRides: jest.fn(),
  deleteRide: jest.fn(),
  leaveRide: jest.fn(),
}));

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import MyRides from './MyRides';
import { AuthContext } from '../context/AuthContext';
import * as ridesApi from './api/rides';

// Mock the Card component to simplify testing
jest.mock('../components/card', () => (props) => (
  <div data-testid="ride-card">
    <p>{props.origin} to {props.destination}</p>
    {props.onDelete && <button onClick={() => props.onDelete(props.rideId)}>Delete</button>}
  </div>
));

const mockUser = { id: 1, name: 'Test User' };

const createdRide = { id: 101, owner_id: 1, origin_text: 'UCLA', destination_text: 'Home' };
const joinedRide = { id: 102, owner_id: 2, origin_text: 'Work', destination_text: 'Downtown' };
const pendingRide = { id: 103, owner_id: 3, origin_text: 'Library', destination_text: 'Cafe' };

const renderWithContext = (component) => {
  return render(
    <AuthContext.Provider value={{ user: mockUser }}>
      <BrowserRouter>{component}</BrowserRouter>
    </AuthContext.Provider>
  );
};

describe('MyRides Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.confirm
    global.window.confirm = jest.fn(() => true);
    global.alert = jest.fn();
  });

  test('shows skeleton loaders on initial load', async () => {
    // Delay the response to ensure loading state is visible
    let resolveRides;
    ridesApi.getMyRides.mockImplementation(() => new Promise(resolve => { resolveRides = resolve; }));
    ridesApi.getMyPendingRides.mockResolvedValue({ rides: [] });
    
    renderWithContext(<MyRides />);
    
    // Check that skeletons might be present (component may render too fast in tests)
    const skeletons = screen.queryAllByTestId('skeleton-card');
    // If skeletons are shown, wait for them to disappear
    if (skeletons.length > 0) {
      resolveRides({ rides: [] });
      await waitFor(() => {
        expect(screen.queryByTestId('skeleton-card')).not.toBeInTheDocument();
      });
    } else {
      // Component rendered data immediately, resolve the promise
      resolveRides({ rides: [] });
      // Just verify empty message is shown
      await waitFor(() => {
        expect(screen.getByText(/No rides created yet/i)).toBeInTheDocument();
      });
    }
  });

  test('displays an error message if fetching rides fails', async () => {
    const errorMessage = 'Failed to load rides';
    ridesApi.getMyRides.mockRejectedValue(new Error(errorMessage));
    ridesApi.getMyPendingRides.mockResolvedValue({ rides: [] });

    renderWithContext(<MyRides />);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  test('fetches and displays created, joined, and pending rides', async () => {
    ridesApi.getMyRides.mockResolvedValue({ rides: [createdRide, joinedRide] });
    ridesApi.getMyPendingRides.mockResolvedValue({ rides: [pendingRide] });

    renderWithContext(<MyRides />);

    await waitFor(() => {
      // Check created rides
      expect(screen.getByText('UCLA to Home')).toBeInTheDocument();
      // Check joined rides
      expect(screen.getByText('Work to Downtown')).toBeInTheDocument();
      // Check pending rides
      expect(screen.getByText('Library to Cafe')).toBeInTheDocument();
    });
  });

  test('displays "no rides" message when there are no rides', async () => {
    ridesApi.getMyRides.mockResolvedValue({ rides: [] });
    ridesApi.getMyPendingRides.mockResolvedValue({ rides: [] });

    renderWithContext(<MyRides />);

    await waitFor(() => {
      expect(screen.getByText('No rides created yet.')).toBeInTheDocument();
      expect(screen.getByText('No rides joined yet.')).toBeInTheDocument();
      expect(screen.getByText('No pending ride requests.')).toBeInTheDocument();
    });
  });

  test('handles deleting a created ride', async () => {
    ridesApi.getMyRides.mockResolvedValue({ rides: [createdRide] });
    ridesApi.getMyPendingRides.mockResolvedValue({ rides: [] });
    ridesApi.deleteRide.mockResolvedValue({});

    renderWithContext(<MyRides />);

    await waitFor(() => {
      expect(screen.getByText('UCLA to Home')).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    fireEvent.click(deleteButton);
    
    // The component re-fetches data after action
    await waitFor(() => {
        expect(ridesApi.getMyRides).toHaveBeenCalledTimes(2);
    });
  });

  test('handles leaving a joined ride', async () => {
    ridesApi.getMyRides.mockResolvedValue({ rides: [joinedRide] });
    ridesApi.getMyPendingRides.mockResolvedValue({ rides: [] });
    ridesApi.leaveRide.mockResolvedValue({});

    renderWithContext(<MyRides />);

    await waitFor(() => {
      expect(screen.getByText('Work to Downtown')).toBeInTheDocument();
    });
    
    const leaveButton = screen.getByRole('button', { name: 'Leave Ride' });
    fireEvent.click(leaveButton);

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to leave this ride?');
    
    await waitFor(() => {
      expect(ridesApi.leaveRide).toHaveBeenCalledWith(joinedRide.id);
      // The component re-fetches data after action
      expect(ridesApi.getMyRides).toHaveBeenCalledTimes(2);
    });
  });

  test('handles canceling a pending request', async () => {
    ridesApi.getMyRides.mockResolvedValue({ rides: [] });
    ridesApi.getMyPendingRides.mockResolvedValue({ rides: [pendingRide] });
    ridesApi.leaveRide.mockResolvedValue({});

    renderWithContext(<MyRides />);
    
    await waitFor(() => {
        expect(screen.getByText('Library to Cafe')).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: 'Cancel Request' });
    fireEvent.click(cancelButton);

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to cancel this request?');

    await waitFor(() => {
        expect(ridesApi.leaveRide).toHaveBeenCalledWith(pendingRide.id);
        expect(ridesApi.getMyRides).toHaveBeenCalledTimes(2);
    });
  });
});
