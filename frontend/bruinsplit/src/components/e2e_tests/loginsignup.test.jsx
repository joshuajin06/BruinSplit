import { jest } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import LoginSignup from '../loginsignup';
import * as AuthContext from '../../context/AuthContext';
import * as profileApi from '../../pages/api/profile';

// Mock dependencies
jest.mock('../../context/AuthContext');
jest.mock('../../pages/api/profile');
jest.mock('../../assets/person.png', () => 'mocked-person.png');

// Mock fetch globally
global.fetch = jest.fn();

const mockLogin = jest.fn();
const mockUpdateUser = jest.fn();

const mockAuthContext = {
  useAuth: jest.fn(() => ({
    login: mockLogin,
    updateUser: mockUpdateUser,
  })),
};

// Wrapper for router context
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('LoginSignup Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockClear();
    AuthContext.useAuth = mockAuthContext.useAuth;
    mockLogin.mockClear();
    mockUpdateUser.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('should render login form by default', () => {
      renderWithRouter(<LoginSignup />);
      
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
    });

    test('should render all required input fields for login', () => {
      renderWithRouter(<LoginSignup />);
      
      const inputs = screen.getAllByRole('textbox');
      expect(inputs).toHaveLength(2); // Username and Email
      expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    });

    test('should not show first/last name fields in login mode', () => {
      renderWithRouter(<LoginSignup />);
      
      expect(screen.queryByPlaceholderText('First Name')).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Last Name')).not.toBeInTheDocument();
    });
  });

  describe('Form State Management', () => {
    test('should update form data when inputs change', async () => {
      const user = userEvent.setup();
      renderWithRouter(<LoginSignup />);
      
      const usernameInput = screen.getByPlaceholderText('Username');
      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');

      await user.type(usernameInput, 'testuser');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      expect(usernameInput.value).toBe('testuser');
      expect(emailInput.value).toBe('test@example.com');
      expect(passwordInput.value).toBe('password123');
    });

    test('should clear error message on new submission', async () => {
      const user = userEvent.setup();
      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      
      renderWithRouter(<LoginSignup />);
      
      const submitButton = screen.getByRole('button', { name: /Login/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });

      global.fetch.mockClear();
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: 1 }, token: 'token' }),
      });

      await user.click(submitButton);
      await waitFor(() => {
        expect(screen.queryByText(/Network error/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Login Functionality', () => {
    test('should handle successful login', async () => {
      const user = userEvent.setup();
      const mockUser = { id: 1, email: 'test@example.com' };
      const mockToken = 'test-token-123';

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser, token: mockToken }),
      });

      profileApi.getProfile.mockResolvedValueOnce({
        profile: mockUser,
      });

      renderWithRouter(<LoginSignup />);

      await user.type(screen.getByPlaceholderText('Username'), 'testuser');
      await user.type(screen.getByPlaceholderText('Email'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('Password'), 'password123');
      await user.click(screen.getByRole('button', { name: /Login/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:8080/api/auth/login',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'test@example.com',
              password: 'password123',
            }),
          })
        );
      });

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith(mockUser, mockToken);
      });

      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalledWith(mockUser);
      });
    });

    test('should display error on failed login', async () => {
      const user = userEvent.setup();

      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid credentials' }),
      });

      renderWithRouter(<LoginSignup />);

      await user.type(screen.getByPlaceholderText('Username'), 'testuser');
      await user.type(screen.getByPlaceholderText('Email'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('Password'), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /Login/i }));

      await waitFor(() => {
        expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
      });
    });

    test('should set loading state during login', async () => {
      const user = userEvent.setup();

      global.fetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithRouter(<LoginSignup />);

      const loginButton = screen.getByRole('button', { name: /Login/i });
      
      await user.click(loginButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Logging in/i })).toBeDisabled();
      });
    });

    test('should handle network errors during login', async () => {
      const user = userEvent.setup();

      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      renderWithRouter(<LoginSignup />);

      await user.type(screen.getByPlaceholderText('Email'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('Password'), 'password123');
      await user.click(screen.getByRole('button', { name: /Login/i }));

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Signup Functionality', () => {
    test('should toggle to signup form', async () => {
      const user = userEvent.setup();
      renderWithRouter(<LoginSignup />);

      const toggleButton = screen.getByText(/Don't have an account\?/i);
      await user.click(toggleButton);

      expect(screen.getByText('Create Account')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('First Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Last Name')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Sign Up/i })).toBeInTheDocument();
    });

    test('should show signup form fields', async () => {
      const user = userEvent.setup();
      renderWithRouter(<LoginSignup />);

      const toggleButton = screen.getByText(/Don't have an account\?/i);
      await user.click(toggleButton);

      expect(screen.getByPlaceholderText('First Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Last Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    });

    test('should handle successful signup', async () => {
      const user = userEvent.setup();
      const mockUser = { id: 1, email: 'newuser@example.com' };
      const mockToken = 'test-token-123';

      renderWithRouter(<LoginSignup />);

      const toggleButton = screen.getByText(/Don't have an account\?/i);
      await user.click(toggleButton);

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser, token: mockToken }),
      });

      profileApi.getProfile.mockResolvedValueOnce({
        profile: mockUser,
      });

      await user.type(screen.getByPlaceholderText('First Name'), 'John');
      await user.type(screen.getByPlaceholderText('Last Name'), 'Doe');
      await user.type(screen.getByPlaceholderText('Username'), 'johndoe');
      await user.type(screen.getByPlaceholderText('Email'), 'john@example.com');
      await user.type(screen.getByPlaceholderText('Password'), 'password123');
      await user.click(screen.getByRole('button', { name: /Sign Up/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:8080/api/auth/signup',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              first_name: 'John',
              last_name: 'Doe',
              email: 'john@example.com',
              password: 'password123',
              username: 'johndoe',
            }),
          })
        );
      });

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith(mockUser, mockToken);
      });
    });

    test('should display error on failed signup', async () => {
      const user = userEvent.setup();

      renderWithRouter(<LoginSignup />);

      const toggleButton = screen.getByText(/Don't have an account\?/i);
      await user.click(toggleButton);

      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Email already exists' }),
      });

      await user.type(screen.getByPlaceholderText('First Name'), 'John');
      await user.type(screen.getByPlaceholderText('Email'), 'existing@example.com');
      await user.type(screen.getByPlaceholderText('Password'), 'password123');
      await user.click(screen.getByRole('button', { name: /Sign Up/i }));

      await waitFor(() => {
        expect(screen.getByText(/Email already exists/i)).toBeInTheDocument();
      });
    });

    test('should toggle back to login form', async () => {
      const user = userEvent.setup();
      renderWithRouter(<LoginSignup />);

      let toggleButton = screen.getByText(/Don't have an account\?/i);
      await user.click(toggleButton);

      expect(screen.getByText('Create Account')).toBeInTheDocument();

      toggleButton = screen.getByText(/Already have an account\?/i);
      await user.click(toggleButton);

      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('First Name')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('should display error with warning icon', async () => {
      const user = userEvent.setup();

      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Test error message' }),
      });

      renderWithRouter(<LoginSignup />);

      await user.type(screen.getByPlaceholderText('Email'), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /Login/i }));

      await waitFor(() => {
        expect(screen.getByText(/⚠️/)).toBeInTheDocument();
        expect(screen.getByText(/Test error message/i)).toBeInTheDocument();
      });
    });

    test('should handle profile fetch error gracefully', async () => {
      const user = userEvent.setup();
      const mockUser = { id: 1, email: 'test@example.com' };
      const mockToken = 'test-token-123';

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser, token: mockToken }),
      });

      profileApi.getProfile.mockRejectedValueOnce(new Error('Profile fetch failed'));

      renderWithRouter(<LoginSignup />);

      await user.type(screen.getByPlaceholderText('Email'), 'test@example.com');
      await user.type(screen.getByPlaceholderText('Password'), 'password123');
      await user.click(screen.getByRole('button', { name: /Login/i }));

      await waitFor(() => {
        expect(screen.getByText(/Profile fetch failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    test('should disable submit button while loading', async () => {
      const user = userEvent.setup();

      global.fetch.mockImplementation(() => new Promise(() => {}));

      renderWithRouter(<LoginSignup />);

      const submitButton = screen.getByRole('button', { name: /Login/i });
      
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    test('should process form with all fields empty', async () => {
      const user = userEvent.setup();

      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Missing fields' }),
      });

      renderWithRouter(<LoginSignup />);

      await user.click(screen.getByRole('button', { name: /Login/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  describe('User Navigation', () => {
    test('should call navigate after successful login', async () => {
      const user = userEvent.setup();
      const mockUser = { id: 1, email: 'test@example.com' };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser, token: 'token' }),
      });

      profileApi.getProfile.mockResolvedValueOnce({
        profile: mockUser,
      });

      renderWithRouter(<LoginSignup />);

      await user.type(screen.getByPlaceholderText('Email'), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /Login/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });
    });
  });

  describe('Password Field', () => {
    test('should render password input as type password', () => {
      renderWithRouter(<LoginSignup />);

      const passwordInput = screen.getByPlaceholderText('Password');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('should accept password input', async () => {
      const user = userEvent.setup();
      renderWithRouter(<LoginSignup />);

      const passwordInput = screen.getByPlaceholderText('Password');
      await user.type(passwordInput, 'securePassword123!');

      expect(passwordInput.value).toBe('securePassword123!');
    });
  });
});
