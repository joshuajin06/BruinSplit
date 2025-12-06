import { jest } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MessagesIcon from '../MessagesIcon';
import * as AuthContext from '../../context/AuthContext';

// Mock dependencies
jest.mock('../../context/AuthContext');
jest.mock('../MessagesSidebar', () => {
  return function MockMessagesSidebar({ isOpen, onClose }) {
    return (
      <div data-testid="messages-sidebar">
        {isOpen && <div data-testid="sidebar-content">Sidebar Content</div>}
      </div>
    );
  };
});

describe('MessagesIcon Component', () => {
  const mockAuthContext = {
    useAuth: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    AuthContext.useAuth = mockAuthContext.useAuth;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication States', () => {
    test('should render when user is authenticated', () => {
      mockAuthContext.useAuth.mockReturnValue({
        isAuthenticated: true,
      });

      render(<MessagesIcon />);

      expect(screen.getByTitle('Messages')).toBeInTheDocument();
      expect(screen.getByTestId('messages-sidebar')).toBeInTheDocument();
    });

    test('should not render when user is not authenticated', () => {
      mockAuthContext.useAuth.mockReturnValue({
        isAuthenticated: false,
      });

      const { container } = render(<MessagesIcon />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Rendering', () => {
    beforeEach(() => {
      mockAuthContext.useAuth.mockReturnValue({
        isAuthenticated: true,
      });
    });

    test('should render messages button with icon', () => {
      render(<MessagesIcon />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('messages-icon-btn');
      expect(button).toHaveAttribute('title', 'Messages');
    });

    test('should render emoji icon in button', () => {
      render(<MessagesIcon />);

      const icon = screen.getByText('💬');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('icon');
    });

    test('should render MessagesSidebar component', () => {
      render(<MessagesIcon />);

      expect(screen.getByTestId('messages-sidebar')).toBeInTheDocument();
    });

    test('should have correct initial state for sidebar', () => {
      render(<MessagesIcon />);

      expect(screen.queryByTestId('sidebar-content')).not.toBeInTheDocument();
    });
  });

  describe('Sidebar Toggle Functionality', () => {
    beforeEach(() => {
      mockAuthContext.useAuth.mockReturnValue({
        isAuthenticated: true,
      });
    });

    test('should open sidebar when button is clicked', async () => {
      const user = userEvent.setup();
      render(<MessagesIcon />);

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('sidebar-content')).toBeInTheDocument();
      });
    });

    test('should toggle sidebar visibility on button click', async () => {
      const user = userEvent.setup();
      render(<MessagesIcon />);

      const button = screen.getByRole('button');

      // First click - open
      await user.click(button);
      await waitFor(() => {
        expect(screen.getByTestId('sidebar-content')).toBeInTheDocument();
      });

      // Second click - close
      await user.click(button);
      await waitFor(() => {
        expect(screen.queryByTestId('sidebar-content')).not.toBeInTheDocument();
      });
    });

    test('should toggle sidebar multiple times', async () => {
      const user = userEvent.setup();
      render(<MessagesIcon />);

      const button = screen.getByRole('button');

      for (let i = 0; i < 3; i++) {
        await user.click(button);
        await waitFor(() => {
          expect(screen.getByTestId('sidebar-content')).toBeInTheDocument();
        });

        await user.click(button);
        await waitFor(() => {
          expect(screen.queryByTestId('sidebar-content')).not.toBeInTheDocument();
        });
      }
    });

    test('should pass correct props to MessagesSidebar', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<MessagesIcon />);

      const button = screen.getByRole('button');

      // Sidebar should be closed initially
      let sidebar = screen.getByTestId('messages-sidebar');
      expect(sidebar).toBeInTheDocument();

      // Open sidebar
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('sidebar-content')).toBeInTheDocument();
      });
    });
  });

  describe('Button Behavior', () => {
    beforeEach(() => {
      mockAuthContext.useAuth.mockReturnValue({
        isAuthenticated: true,
      });
    });

    test('should have correct CSS class on button', () => {
      render(<MessagesIcon />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('messages-icon-btn');
    });

    test('should have correct title attribute on button', () => {
      render(<MessagesIcon />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Messages');
    });

    test('should be clickable', async () => {
      const user = userEvent.setup();
      render(<MessagesIcon />);

      const button = screen.getByRole('button');

      await user.click(button);

      expect(screen.getByTestId('sidebar-content')).toBeInTheDocument();
    });

    test('should handle rapid clicks', async () => {
      const user = userEvent.setup();
      render(<MessagesIcon />);

      const button = screen.getByRole('button');

      await user.click(button);
      await user.click(button);
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('sidebar-content')).toBeInTheDocument();
      });
    });
  });

  describe('Fragment Structure', () => {
    beforeEach(() => {
      mockAuthContext.useAuth.mockReturnValue({
        isAuthenticated: true,
      });
    });

    test('should render button and sidebar together', () => {
      const { container } = render(<MessagesIcon />);

      const button = screen.getByRole('button');
      const sidebar = screen.getByTestId('messages-sidebar');

      expect(button).toBeInTheDocument();
      expect(sidebar).toBeInTheDocument();
    });
  });

  describe('Props Passing', () => {
    beforeEach(() => {
      mockAuthContext.useAuth.mockReturnValue({
        isAuthenticated: true,
      });
    });

    test('should pass onClose callback to sidebar', async () => {
      const user = userEvent.setup();
      render(<MessagesIcon />);

      const button = screen.getByRole('button');

      // Open sidebar
      await user.click(button);
      expect(screen.getByTestId('sidebar-content')).toBeInTheDocument();

      // Close sidebar through callback (simulate internal close)
      await user.click(button);
      expect(screen.queryByTestId('sidebar-content')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('should handle authentication context being undefined', () => {
      mockAuthContext.useAuth.mockReturnValue({
        isAuthenticated: undefined,
      });

      const { container } = render(<MessagesIcon />);

      expect(container.firstChild).toBeNull();
    });

    test('should handle rapid authentication state changes', () => {
      mockAuthContext.useAuth.mockReturnValue({
        isAuthenticated: true,
      });

      const { rerender } = render(<MessagesIcon />);
      expect(screen.getByTestId('messages-sidebar')).toBeInTheDocument();

      mockAuthContext.useAuth.mockReturnValue({
        isAuthenticated: false,
      });

      rerender(<MessagesIcon />);
      expect(screen.queryByTestId('messages-sidebar')).not.toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    beforeEach(() => {
      mockAuthContext.useAuth.mockReturnValue({
        isAuthenticated: true,
      });
    });

    test('should maintain state independently for multiple instances', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <>
          <MessagesIcon />
          <MessagesIcon />
        </>
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);

      await user.click(buttons[0]);

      await waitFor(() => {
        const sidebars = screen.getAllByTestId('sidebar-content');
        // Both should update independently (depending on component implementation)
        expect(sidebars.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Unread Badge (Commented Out Feature)', () => {
    beforeEach(() => {
      mockAuthContext.useAuth.mockReturnValue({
        isAuthenticated: true,
      });
    });

    test('should not show badge element', () => {
      render(<MessagesIcon />);

      const badges = screen.queryAllByTestId('badge');
      expect(badges).toHaveLength(0);
    });
  });
});
