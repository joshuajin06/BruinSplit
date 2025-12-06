import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, useParams, Routes, Route } from 'react-router-dom';
import Profile from './Profile';
import { AuthContext } from '../context/AuthContext';
import * as profileApi from './api/profile';
import * as friendsApi from './api/friends';
import * as ridesApi from './api/rides';

// Mock all API modules
jest.mock('./api/profile');
jest.mock('./api/friends');
jest.mock('./api/rides');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockUser = { id: '1', first_name: 'Test', last_name: 'User', email: 'test@example.com', username: 'testuser' };
const otherUser = { id: '2', first_name: 'Other', last_name: 'User', email: 'other@example.com', username: 'otheruser' };

const renderProfile = (user, initialEntries = ['/profile']) => {
  return render(
    <AuthContext.Provider value={{ user, logout: mockNavigate, updateUser: jest.fn() }}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
            <Route path="/profile/:userId" element={<Profile />} />
            <Route path="/profile" element={<Profile />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('Profile Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    profileApi.getProfileById.mockResolvedValue(otherUser);
    friendsApi.getFriendCount.mockResolvedValue({ friend_count: 5 });
    friendsApi.getFriends.mockResolvedValue({ friends: [{ id: '3', first_name: 'A', last_name: 'Friend' }] });
    friendsApi.getUserFriends.mockResolvedValue({ friends: [{ id: '4', first_name: 'B', last_name: 'Friend' }] });
    friendsApi.getPendingRequests.mockResolvedValue({ sent: [], received: [] });
    ridesApi.getMyRides.mockResolvedValue({ rides: [{ id: 1, origin_text: 'My Ride' }] });
    ridesApi.getFriendRides.mockResolvedValue({ rides: [{ id: 2, origin_text: 'Friend Ride' }] });
  });

  describe('Viewing Own Profile', () => {
    it('renders personal information and action buttons', async () => {
      renderProfile(mockUser);
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /My Profile/i })).toBeInTheDocument();
        expect(screen.getByText(mockUser.email)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Edit Profile/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Change Password/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Logout/i })).toBeInTheDocument();
      });
    });

    it('allows editing and saving profile information', async () => {
        profileApi.updateProfile.mockResolvedValue({ ...mockUser, first_name: 'Updated' });
        renderProfile(mockUser);
        
        await waitFor(() => {
            fireEvent.click(screen.getByRole('button', { name: /Edit Profile/i }));
        });
        
        fireEvent.change(screen.getByPlaceholderText('First Name'), { target: { value: 'Updated' } });
        fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));
        
        await waitFor(() => {
            expect(profileApi.updateProfile).toHaveBeenCalledWith(expect.objectContaining({ first_name: 'Updated' }));
            expect(screen.queryByPlaceholderText('First Name')).not.toBeInTheDocument();
        });
    });

    it('allows changing password', async () => {
        profileApi.updatePassword.mockResolvedValue({});
        renderProfile(mockUser);

        await waitFor(() => {
            fireEvent.click(screen.getByRole('button', { name: /Change Password/i }));
        });

        fireEvent.change(screen.getByPlaceholderText('Old Password'), { target: { value: 'old' } });
        fireEvent.change(screen.getByPlaceholderText('New Password'), { target: { value: 'new' } });
        fireEvent.change(screen.getByPlaceholderText('Confirm new Password'), { target: { value: 'new' } });
        fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

        await waitFor(() => {
            expect(profileApi.updatePassword).toHaveBeenCalled();
            expect(screen.queryByPlaceholderText('Old Password')).not.toBeInTheDocument();
        });
    });

    it('handles logout', async () => {
        renderProfile(mockUser);
        await waitFor(() => {
            fireEvent.click(screen.getByRole('button', { name: /Logout/i }));
        });
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe("Viewing Another User's Profile", () => {
    it("renders other user's info and friend's rides", async () => {
        renderProfile(mockUser, ['/profile/2']);
        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Other's Profile/i })).toBeInTheDocument();
            expect(screen.getByText(otherUser.email)).toBeInTheDocument();
            expect(screen.getByText('Friend Ride')).toBeInTheDocument();
            expect(screen.queryByRole('button', { name: /Edit Profile/i })).not.toBeInTheDocument();
        });
    });

    it('shows "Send Friend Request" button if not friends', async () => {
      friendsApi.getFriends.mockResolvedValue({ friends: [] });
      friendsApi.getPendingRequests.mockResolvedValue({ sent: [], received: [] });
      renderProfile(mockUser, ['/profile/2']);
      
      await waitFor(() => {
          expect(screen.getByRole('button', { name: /Send Friend Request/i })).toBeInTheDocument();
      });
      fireEvent.click(screen.getByRole('button', { name: /Send Friend Request/i }));
      await waitFor(() => {
          expect(friendsApi.sendFriendRequest).toHaveBeenCalledWith('2');
      });
    });

    it('shows "Request Sent" if friend request is pending', async () => {
        friendsApi.getFriends.mockResolvedValue({ friends: [] });
        friendsApi.getPendingRequests.mockResolvedValue({ sent: [otherUser], received: [] });
        renderProfile(mockUser, ['/profile/2']);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Request Sent/i })).toBeInTheDocument();
        });
    });
  });

  describe("Friends Modal", () => {
    it('opens and displays friends for own profile', async () => {
        renderProfile(mockUser);
        await waitFor(() => {
            fireEvent.click(screen.getByText(/Friend/));
        });
        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /My Friends/i })).toBeInTheDocument();
            expect(screen.getByText('A Friend')).toBeInTheDocument();
        });
    });
  });

  describe("Requests Modal", () => {
    it('opens and displays friend requests', async () => {
        friendsApi.getPendingRequests.mockResolvedValue({ sent: [], received: [{ id: '5', first_name: 'Pending' }] });
        renderProfile(mockUser);
        
        await waitFor(() => {
            fireEvent.click(screen.getByText('Requests'));
        });

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: /Friend Requests/i })).toBeInTheDocument();
            expect(screen.getByText('Pending')).toBeInTheDocument();
        });
    });

    it('allows accepting a friend request', async () => {
        friendsApi.getPendingRequests.mockResolvedValue({ sent: [], received: [{ id: '5', first_name: 'Pending' }] });
        friendsApi.acceptFriendRequest.mockResolvedValue({});
        renderProfile(mockUser);
        
        await waitFor(() => {
            fireEvent.click(screen.getByText('Requests'));
        });
        
        await waitFor(() => {
            fireEvent.click(screen.getByRole('button', { name: '✓' }));
        });
        
        await waitFor(() => {
            expect(friendsApi.acceptFriendRequest).toHaveBeenCalledWith('5');
        });
    });

    it('allows rejecting a friend request', async () => {
        friendsApi.getPendingRequests.mockResolvedValue({ sent: [], received: [{ id: '5', first_name: 'Pending' }] });
        friendsApi.rejectFriendRequest.mockResolvedValue({});
        renderProfile(mockUser);
        
        await waitFor(() => {
            fireEvent.click(screen.getByText('Requests'));
        });
        
        await waitFor(() => {
            fireEvent.click(screen.getByRole('button', { name: '✕' }));
        });
        
        await waitFor(() => {
            expect(friendsApi.rejectFriendRequest).toHaveBeenCalledWith('5');
        });
    });
  });
});
