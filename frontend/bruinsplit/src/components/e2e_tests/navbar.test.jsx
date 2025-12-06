import { jest } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../navbar';
import * as AuthContext from '../../context/AuthContext';

jest.mock('../../context/AuthContext');
jest.mock('../../assets/finalogofinal.png', () => 'mocked-logo.png');

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Navbar Component', () => {
  const mockLogout = jest.fn();

  const mockAuthContextAuthenticated = {
    useAuth: jest.fn(() => ({
      logout: mockLogout,
      isAuthenticated: true,
      user: {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        profile_photo_url: 'https://example.com/photo.jpg'
      }
    }))
  };

  const mockAuthContextUnauthenticated = {
    useAuth: jest.fn(() => ({
      logout: mockLogout,
      isAuthenticated: false,
      user: null
    }))
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('should render navbar with logo and title', () => {
      AuthContext.useAuth = mockAuthContextAuthenticated.useAuth;
      renderWithRouter(<Navbar />);

      expect(screen.getByRole('img', { name: /Site Name/i })).toBeInTheDocument();
      expect(screen.getByText('BruinSplit')).toBeInTheDocument();
    });

    test('should render navigation links', () => {
      AuthContext.useAuth = mockAuthContextAuthenticated.useAuth;
      renderWithRouter(<Navbar />);

      expect(screen.getByRole('link', { name: /Postings/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /My Rides/i })).toBeInTheDocument();
    });

    test('should have correct href for navigation links', () => {
      AuthContext.useAuth = mockAuthContextAuthenticated.useAuth;
      renderWithRouter(<Navbar />);

      const postingsLink = screen.getByRole('link', { name: /Postings/i });
      const myRidesLink = screen.getByRole('link', { name: /My Rides/i });

      expect(postingsLink).toHaveAttribute('href', '/postings');
      expect(myRidesLink).toHaveAttribute('href', '/myrides');
    });

    test('should render logo with correct src', () => {
      AuthContext.useAuth = mockAuthContextAuthenticated.useAuth;
      renderWithRouter(<Navbar />);

      const logo = screen.getByRole('img', { name: /Site Name/i });
      expect(logo).toHaveClass('logo');
    });
  });

  describe('Authentication States', () => {
    test('should display user profile photo when authenticated', () => {
      AuthContext.useAuth = mockAuthContextAuthenticated.useAuth;
      renderWithRouter(<Navbar />);

      const profilePhoto = screen.getByAltText('Profile');
      expect(profilePhoto).toBeInTheDocument();
      expect(profilePhoto).toHaveAttribute('src', 'https://example.com/photo.jpg');
      expect(profilePhoto).toHaveClass('navbar-profile-pic');
    });

    test('should display profile placeholder with first name initial when no photo', () => {
      const authContextNoPhoto = {
        useAuth: jest.fn(() => ({
          logout: mockLogout,
          isAuthenticated: true,
          user: {
            id: 1,
            first_name: 'John',
            last_name: 'Doe',
            profile_photo_url: null
          }
        }))
      };
      AuthContext.useAuth = authContextNoPhoto.useAuth;
      renderWithRouter(<Navbar />);

      expect(screen.getByText('J')).toBeInTheDocument();
      const placeholder = screen.getByText('J').closest('div');
      expect(placeholder).toHaveClass('navbar-profile-placeholder');
    });

    test('should display "U" placeholder when no user first name', () => {
      const authContextNoName = {
        useAuth: jest.fn(() => ({
          logout: mockLogout,
          isAuthenticated: true,
          user: {
            id: 1,
            profile_photo_url: null
          }
        }))
      };
      AuthContext.useAuth = authContextNoName.useAuth;
      renderWithRouter(<Navbar />);

      expect(screen.getByText('U')).toBeInTheDocument();
    });

    test('should show "Logout" when authenticated', () => {
      AuthContext.useAuth = mockAuthContextAuthenticated.useAuth;
      renderWithRouter(<Navbar />);

      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    test('should show "Sign In" when not authenticated', () => {
      AuthContext.useAuth = mockAuthContextUnauthenticated.useAuth;
      renderWithRouter(<Navbar />);

      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });
  });

  describe('Profile Submenu', () => {
    test('should display submenu with View Profile option when authenticated', () => {
      AuthContext.useAuth = mockAuthContextAuthenticated.useAuth;
      renderWithRouter(<Navbar />);

      expect(screen.getByRole('link', { name: /View Profile/i })).toBeInTheDocument();
    });

    test('should not display View Profile option when not authenticated', () => {
      AuthContext.useAuth = mockAuthContextUnauthenticated.useAuth;
      renderWithRouter(<Navbar />);

      expect(screen.queryByRole('link', { name: /View Profile/i })).not.toBeInTheDocument();
    });

    test('should have correct href for View Profile link', () => {
      AuthContext.useAuth = mockAuthContextAuthenticated.useAuth;
      renderWithRouter(<Navbar />);

      const viewProfileLink = screen.getByRole('link', { name: /View Profile/i });
      expect(viewProfileLink).toHaveAttribute('href', '/profile');
    });

    test('should display profile button', () => {
      AuthContext.useAuth = mockAuthContextAuthenticated.useAuth;
      renderWithRouter(<Navbar />);

      const profileButton = document.querySelector('.profileButton');
      expect(profileButton).toBeInTheDocument();
    });

    test('should display submenu container', () => {
      AuthContext.useAuth = mockAuthContextAuthenticated.useAuth;
      renderWithRouter(<Navbar />);

      const submenu = document.querySelector('.submenu');
      expect(submenu).toBeInTheDocument();
    });
  });

  describe('Logout Functionality', () => {
    test('should call logout when Logout link is clicked and user is authenticated', () => {
      AuthContext.useAuth = mockAuthContextAuthenticated.useAuth;
      renderWithRouter(<Navbar />);

      const logoutLink = screen.getByRole('link', { name: /Logout/i });
      fireEvent.click(logoutLink);

      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    test('should not call logout when Sign In link is clicked and user is not authenticated', () => {
      AuthContext.useAuth = mockAuthContextUnauthenticated.useAuth;
      renderWithRouter(<Navbar />);

      const signInLink = screen.getByRole('link', { name: /Sign In/i });
      fireEvent.click(signInLink);

      expect(mockLogout).not.toHaveBeenCalled();
    });

    test('should navigate to /login when logout is clicked', () => {
      AuthContext.useAuth = mockAuthContextAuthenticated.useAuth;
      renderWithRouter(<Navbar />);

      const logoutLink = screen.getByRole('link', { name: /Logout/i });
      expect(logoutLink).toHaveAttribute('href', '/login');
    });

    test('should navigate to /login when sign in is clicked', () => {
      AuthContext.useAuth = mockAuthContextUnauthenticated.useAuth;
      renderWithRouter(<Navbar />);

      const signInLink = screen.getByRole('link', { name: /Sign In/i });
      expect(signInLink).toHaveAttribute('href', '/login');
    });
  });

  describe('Navigation Structure', () => {
    test('should render nav element', () => {
      AuthContext.useAuth = mockAuthContextAuthenticated.useAuth;
      renderWithRouter(<Navbar />);

      const navElement = screen.getByRole('navigation');
      expect(navElement).toHaveClass('navbar');
    });

    test('should render title with correct link to home', () => {
      AuthContext.useAuth = mockAuthContextAuthenticated.useAuth;
      renderWithRouter(<Navbar />);

      const homeLink = screen.getByRole('heading').querySelector('a');
      expect(homeLink).toHaveAttribute('href', '/');
    });

    test('should have correct class for site title', () => {
      AuthContext.useAuth = mockAuthContextAuthenticated.useAuth;
      renderWithRouter(<Navbar />);

      const siteTitle = screen.getByRole('heading');
      expect(siteTitle).toHaveClass('siteTitle');
    });

    test('should have correct class for nav links', () => {
      AuthContext.useAuth = mockAuthContextAuthenticated.useAuth;
      renderWithRouter(<Navbar />);

      const navLinks = document.querySelector('.nav-linksR');
      expect(navLinks).toBeInTheDocument();
    });
  });

  describe('Responsive Design Classes', () => {
    test('should have myrides class on My Rides link', () => {
      AuthContext.useAuth = mockAuthContextAuthenticated.useAuth;
      renderWithRouter(<Navbar />);

      const myRidesItem = screen.getByRole('link', { name: /My Rides/i }).closest('li');
      expect(myRidesItem).toHaveClass('myrides');
    });

    test('should have navButtonLogin class on profile menu item', () => {
      AuthContext.useAuth = mockAuthContextAuthenticated.useAuth;
      renderWithRouter(<Navbar />);

      const navButtonLogin = document.querySelector('.navButtonLogin');
      expect(navButtonLogin).toBeInTheDocument();
    });

    test('should have submenu-item class on submenu links', () => {
      AuthContext.useAuth = mockAuthContextAuthenticated.useAuth;
      renderWithRouter(<Navbar />);

      const submenuItems = document.querySelectorAll('.submenu-item');
      expect(submenuItems.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle null user gracefully', () => {
      const authContextNullUser = {
        useAuth: jest.fn(() => ({
          logout: mockLogout,
          isAuthenticated: false,
          user: null
        }))
      };
      AuthContext.useAuth = authContextNullUser.useAuth;

      expect(() => renderWithRouter(<Navbar />)).not.toThrow();
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    test('should handle undefined user properties gracefully', () => {
      const authContextUndefinedProps = {
        useAuth: jest.fn(() => ({
          logout: mockLogout,
          isAuthenticated: true,
          user: {
            id: 1
          }
        }))
      };
      AuthContext.useAuth = authContextUndefinedProps.useAuth;

      renderWithRouter(<Navbar />);
      expect(screen.getByText('U')).toBeInTheDocument();
    });

    test('should render correctly with empty user object', () => {
      const authContextEmptyUser = {
        useAuth: jest.fn(() => ({
          logout: mockLogout,
          isAuthenticated: true,
          user: {}
        }))
      };
      AuthContext.useAuth = authContextEmptyUser.useAuth;

      renderWithRouter(<Navbar />);
      expect(screen.getByText('U')).toBeInTheDocument();
    });
  });

  describe('Logo Click Navigation', () => {
    test('should navigate to home when logo is clicked', () => {
      AuthContext.useAuth = mockAuthContextAuthenticated.useAuth;
      renderWithRouter(<Navbar />);

      const logoLink = screen.getByRole('heading').querySelector('a');
      expect(logoLink).toHaveAttribute('href', '/');
    });

    test('should navigate to home when BruinSplit text is clicked', () => {
      AuthContext.useAuth = mockAuthContextAuthenticated.useAuth;
      renderWithRouter(<Navbar />);

      const bruinSplitLink = screen.getByText('BruinSplit').closest('a');
      expect(bruinSplitLink).toHaveAttribute('href', '/');
    });
  });

  describe('Accessibility', () => {
    test('should have alt text for logo image', () => {
      AuthContext.useAuth = mockAuthContextAuthenticated.useAuth;
      renderWithRouter(<Navbar />);

      const logo = screen.getByRole('img', { name: /Site Name/i });
      expect(logo).toHaveAttribute('alt', 'Site Name');
    });

    test('should have alt text for profile photo', () => {
      AuthContext.useAuth = mockAuthContextAuthenticated.useAuth;
      renderWithRouter(<Navbar />);

      const profilePhoto = screen.getByAltText('Profile');
      expect(profilePhoto).toBeInTheDocument();
    });

    test('should have semantic navigation element', () => {
      AuthContext.useAuth = mockAuthContextAuthenticated.useAuth;
      renderWithRouter(<Navbar />);

      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    test('should have proper heading structure', () => {
      AuthContext.useAuth = mockAuthContextAuthenticated.useAuth;
      renderWithRouter(<Navbar />);

      const heading = screen.getByRole('heading');
      expect(heading.tagName).toBe('H2');
    });
  });
});
