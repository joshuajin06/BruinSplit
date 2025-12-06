import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import LoginSignup from '../components/loginsignup';
import { AuthContext } from '../context/AuthContext';
import * as profileApi from './api/profile';

// Mock the useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock the useAuth hook
const mockLogin = jest.fn();
const mockUpdateUser = jest.fn();
jest.mock('../context/AuthContext', () => ({
  ...jest.requireActual('../context/AuthContext'),
  useAuth: () => ({
    login: mockLogin,
    updateUser: mockUpdateUser,
  }),
}));

// Mock the getProfile API call
jest.mock('./api/profile', () => ({
  getProfile: jest.fn(),
}));

// Mock global fetch
global.fetch = jest.fn();

const renderWithContext = (component) => {
  return render(
    <AuthContext.Provider value={{ login: mockLogin, updateUser: mockUpdateUser, user: null, loading: false, checkAuth: jest.fn(), isAuthenticated: false, logout: jest.fn() }}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </AuthContext.Provider>
  );
};

describe('LoginSignup Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    fetch.mockClear();
  });

  test('renders the login form by default', () => {
    renderWithContext(<LoginSignup />);
    expect(screen.getByRole('heading', { name: /Welcome Back/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  test('toggles to the signup form', () => {
    renderWithContext(<LoginSignup />);
    fireEvent.click(screen.getByText(/Don't have an account\?/i));
    expect(screen.getByRole('heading', { name: /Create Account/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('First Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Last Name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument();
  });

  test('handles successful login', async () => {
    const user = { id: 1, email: 'test@example.com' };
    const token = 'fake-token';
    const profile = { username: 'testuser' };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user, token }),
    });
    profileApi.getProfile.mockResolvedValueOnce({ profile });

    renderWithContext(<LoginSignup />);
    
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/auth/login', expect.any(Object));
      expect(mockLogin).toHaveBeenCalledWith(user, token);
    });
    await waitFor(() => {
        expect(profileApi.getProfile).toHaveBeenCalled();
        expect(mockUpdateUser).toHaveBeenCalledWith(profile);
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('handles failed login and displays an error message', async () => {
    const errorMessage = 'Invalid credentials';
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: errorMessage }),
    });

    renderWithContext(<LoginSignup />);

    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'wrong@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(screen.getByText(`⚠️ ${errorMessage}`)).toBeInTheDocument();
    });
    expect(mockLogin).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('handles successful signup', async () => {
    const user = { id: 2, email: 'newuser@example.com' };
    const token = 'new-fake-token';
    const profile = { username: 'newuser' };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user, token }),
    });
    profileApi.getProfile.mockResolvedValueOnce({ profile });

    renderWithContext(<LoginSignup />);
    
    // Switch to sign up
    fireEvent.click(screen.getByText(/Don't have an account\?/i));

    // Fill form
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByPlaceholderText('First Name'), { target: { value: 'New' } });
    fireEvent.change(screen.getByPlaceholderText('Last Name'), { target: { value: 'User' } });
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'newuser@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/auth/signup', expect.any(Object));
      expect(mockLogin).toHaveBeenCalledWith(user, token);
    });
    await waitFor(() => {
        expect(profileApi.getProfile).toHaveBeenCalled();
        expect(mockUpdateUser).toHaveBeenCalledWith(profile);
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('handles failed signup and displays an error message', async () => {
    const errorMessage = 'Email already exists';
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: errorMessage }),
    });

    renderWithContext(<LoginSignup />);
    
    // Switch to sign up
    fireEvent.click(screen.getByText(/Don't have an account\?/i));

    // Fill form and submit
    fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'existinguser' } });
    fireEvent.change(screen.getByPlaceholderText('First Name'), { target: { value: 'Existing' } });
    fireEvent.change(screen.getByPlaceholderText('Last Name'), { target: { value: 'User' } });
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'existing@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    await waitFor(() => {
      expect(screen.getByText(`⚠️ ${errorMessage}`)).toBeInTheDocument();
    });
    expect(mockLogin).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
