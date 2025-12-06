import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Card from '../card';
import { AuthContext } from '../../context/AuthContext';
import * as ridesApi from '../../pages/api/rides';

// Mock dependencies
jest.mock('../../pages/api/rides');
jest.mock('../../pages/api/friends', () => ({
  sendFriendRequest: jest.fn(),
  getFriends: jest.fn(),
  getPendingRequests: jest.fn().mockResolvedValue({ sent: [] }),
}));

// Mock cardUtils
jest.mock('../utils/cardUtils', () => ({
    getTimeAgo: jest.fn((date) => 'a while ago'),
    formatDatetimeLocal: jest.fn((date) => '2025-01-01T12:00'),
    hashString: jest.fn((str) => 1),
}));


const mockUser = { id: 1, username: 'testuser' };
const mockOwner = { id: 2, username: 'owner' };

const renderCardWithProvider = (
  props,
  currentUser = mockUser,
  membershipStatus = null
) => {
  const rideDetails = {
    membership_status: membershipStatus,
    current_members: 2,
    seats: 4,
    ...props.rideDetails,
  };

  return render(
    <BrowserRouter>
      <AuthContext.Provider value={{ user: currentUser }}>
        <div id="modal-root"></div>
        <Card {...props} rideDetails={rideDetails} />
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('Card Component', () => {
  const baseProps = {
    title: 'Test Ride',
    origin: 'UCLA',
    destination: 'Downtown LA',
    departureDatetime: '2025-01-01T12:00:00Z',
    maxRiders: 4,
    rideId: 'ride-123',
    ownerId: mockOwner.id,
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    jest.spyOn(window.localStorage.__proto__, 'getItem').mockReturnValue(JSON.stringify(mockUser));
  });

  test('renders basic card information', async () => {
    ridesApi.getRideById.mockResolvedValue({
      ride: {
        ...baseProps,
        members: [
          { id: 1, status: 'CONFIRMED JOINING' },
          { id: 2, status: 'CONFIRMED JOINING' }
        ],
      },
    });

    renderCardWithProvider(baseProps);

    expect(screen.getByText('UCLA ➡ Downtown LA')).toBeInTheDocument();
    expect(screen.getByText(/Departing at:/)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('2 of 4 seats available')).toBeInTheDocument();
    });
  });

  test('shows "Join Ride" button for a regular user', () => {
    renderCardWithProvider(baseProps, mockUser, null);
    expect(screen.getByRole('button', { name: 'Join Ride' })).toBeInTheDocument();
  });

    test('shows "Joined" when user is confirmed', () => {
        renderCardWithProvider(baseProps, mockUser, 'CONFIRMED JOINING');
        expect(screen.getByRole('button', { name: 'Joined' })).toBeInTheDocument();
    });

    test('shows "Pending" when user has a pending request', () => {
        renderCardWithProvider(baseProps, mockUser, 'PENDING');
        expect(screen.getByRole('button', { name: 'Pending' })).toBeInTheDocument();
    });

  test('shows owner controls when the user is the owner', () => {
    jest.spyOn(window.localStorage.__proto__, 'getItem').mockReturnValue(JSON.stringify(mockOwner));
    renderCardWithProvider(baseProps, mockOwner, 'CONFIRMED JOINING');

    // Check for owner-specific buttons
    expect(screen.getByTitle('Delete Ride')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View Ride' })).toBeInTheDocument();
  });


  test('opens details modal when "Details" button is clicked', async () => {
    ridesApi.getRideById.mockResolvedValue({
        ride: {
            ...baseProps,
            owner: { id: mockOwner.id, first_name: 'Owner', last_name: 'User' },
            members: [],
        },
    });

    renderCardWithProvider(baseProps);

    const detailsButton = screen.getByRole('button', { name: 'Details' });
    fireEvent.click(detailsButton);

    // The modal's content should now be visible
    expect(await screen.findByText('Ride Details')).toBeInTheDocument();
  });

    test('opens delete confirmation modal when delete button is clicked', () => {
        jest.spyOn(window.localStorage.__proto__, 'getItem').mockReturnValue(JSON.stringify(mockOwner));
        renderCardWithProvider(baseProps, mockOwner);

        const deleteButton = screen.getByTitle('Delete Ride');
        fireEvent.click(deleteButton);

        expect(screen.getByText('Delete Ride?')).toBeInTheDocument();
        expect(screen.getByText(/Are you sure you want to permanently delete this ride group?/)).toBeInTheDocument();
    });
});
