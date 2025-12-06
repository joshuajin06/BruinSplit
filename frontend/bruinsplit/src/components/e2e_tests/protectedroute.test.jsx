import { jest } from '@jest/globals';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, Routes, Route, MemoryRouter } from 'react-router-dom';
import ProtectedRoute from '../protectedroute';
import * as AuthContext from '../../context/AuthContext';

// Mock dependencies
jest.mock('../../context/AuthContext');

const renderWithRouter = (component, initialRoute = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/protected" element={component} />
        <Route path="/" element={<div>Home Page</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('ProtectedRoute Component', () => {
  const mockAuthContextAuthenticated = {
    useAuth: jest.fn(() => ({
      loading: false,
      isAuthenticated: true
    }))
  };

  const mockAuthContextUnauthenticated = {
    useAuth: jest.fn(() => ({
      loading: false,
      isAuthenticated: false
    }))
  };

  const mockAuthContextLoading = {
    useAuth: jest.fn(() => ({
      loading: true,
      isAuthenticated: false
    }))
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication States', () => {
    test('should render children when user is authenticated', () => {
      AuthContext.useAuth = mockAuthContextAuthenticated.useAuth;
      
      renderWithRouter(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        '/protected'
      );
      
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    test('should redirect to login when user is not authenticated', () => {
      AuthContext.useAuth = mockAuthContextUnauthenticated.useAuth;
      
      renderWithRouter(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        '/protected'
      );
      
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    test('should show loading state when authentication is loading', () => {
      AuthContext.useAuth = mockAuthContextLoading.useAuth;
      
      renderWithRouter(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        '/protected'
      );
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    test('should not show loading after authentication completes', async () => {
      AuthContext.useAuth = mockAuthContextLoading.useAuth;
      
      const { rerender } = renderWithRouter(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        '/protected'
      );
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      
      // Update to authenticated
      AuthContext.useAuth = mockAuthContextAuthenticated.useAuth;
      
      rerender(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/login" element={<div>Login Page</div>} />
            <Route 
              path="/protected" 
              element={
                <ProtectedRoute>
                  <div>Protected Content</div>
                </ProtectedRoute>
              } 
            />
          </Routes>
        </MemoryRouter>
      );
      
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });
  });

  describe('Children Rendering', () => {
    test('should render single child component', () => {
      AuthContext.useAuth = mockAuthContextAuthenticated.useAuth;
      
      renderWithRouter(
        <ProtectedRoute>
          <div data-testid="child">Child Component</div>
        </ProtectedRoute>,
        '/protected'
      );
      
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    test('should render multiple children', () => {
      AuthContext.useAuth = mockAuthContextAuthenticated.useAuth;
      
      renderWithRouter(
        <ProtectedRoute>
          <div>First Child</div>
          <div>Second Child</div>
          <div>Third Child</div>
        </ProtectedRoute>,
        '/protected'
      );
      
      expect(screen.getByText('First Child')).toBeInTheDocument();
      expect(screen.getByText('Second Child')).toBeInTheDocument();
      expect(screen.getByText('Third Child')).toBeInTheDocument();
    });

    test('should render complex child components', () => {
      AuthContext.useAuth = mockAuthContextAuthenticated.useAuth;
      
      const ComplexComponent = () => (
        <div>
          <h1>Title</h1>
          <p>Description</p>
          <button>Action</button>
        </div>
      );
      
      renderWithRouter(
        <ProtectedRoute>
          <ComplexComponent />
        </ProtectedRoute>,
        '/protected'
      );
      
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });

    test('should not render children when not authenticated', () => {
      AuthContext.useAuth = mockAuthContextUnauthenticated.useAuth;
      
      renderWithRouter(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>,
        '/protected'
      );
      
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    test('should not render children when loading', () => {
      AuthContext.useAuth = mockAuthContextLoading.useAuth;
      
      renderWithRouter(
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>,
        '/protected'
      );
      
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('Navigation Behavior', () => {
    test('should redirect with replace option', () => {
      AuthContext.useAuth = mockAuthContextUnauthenticated.useAuth;
      
      renderWithRouter(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        '/protected'
      );
      
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    test('should maintain redirect to login path', () => {
      AuthContext.useAuth = mockAuthContextUnauthenticated.useAuth;
      
      renderWithRouter(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        '/protected'
      );
      
      // Should be on login page
      expect(screen.getByText('Login Page')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    test('should display "Loading..." text', () => {
      AuthContext.useAuth = mockAuthContextLoading.useAuth;
      
      renderWithRouter(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        '/protected'
      );
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    test('should wrap loading text in div', () => {
      AuthContext.useAuth = mockAuthContextLoading.useAuth;
      
      const { container } = renderWithRouter(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        '/protected'
      );
      
      const loadingDiv = container.querySelector('div');
      expect(loadingDiv).toHaveTextContent('Loading...');
    });

    test('should only show loading during authentication check', () => {
      AuthContext.useAuth = mockAuthContextLoading.useAuth;
      
      renderWithRouter(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        '/protected'
      );
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('should handle null children gracefully', () => {
      AuthContext.useAuth = mockAuthContextAuthenticated.useAuth;
      
      expect(() => 
        renderWithRouter(
          <ProtectedRoute>
            {null}
          </ProtectedRoute>,
          '/protected'
        )
      ).not.toThrow();
    });

    test('should handle undefined children gracefully', () => {
      AuthContext.useAuth = mockAuthContextAuthenticated.useAuth;
      
      expect(() => 
        renderWithRouter(
          <ProtectedRoute>
            {undefined}
          </ProtectedRoute>,
          '/protected'
        )
      ).not.toThrow();
    });

    test('should handle empty children', () => {
      AuthContext.useAuth = mockAuthContextAuthenticated.useAuth;
      
      expect(() => 
        renderWithRouter(
          <ProtectedRoute>
            {''}
          </ProtectedRoute>,
          '/protected'
        )
      ).not.toThrow();
    });

    test('should handle boolean children', () => {
      AuthContext.useAuth = mockAuthContextAuthenticated.useAuth;
      
      expect(() => 
        renderWithRouter(
          <ProtectedRoute>
            {false}
          </ProtectedRoute>,
          '/protected'
        )
      ).not.toThrow();
    });

    test('should handle loading undefined', () => {
      const mockContext = {
        useAuth: jest.fn(() => ({
          loading: undefined,
          isAuthenticated: true
        }))
      };
      AuthContext.useAuth = mockContext.useAuth;
      
      renderWithRouter(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        '/protected'
      );
      
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    test('should handle isAuthenticated undefined', () => {
      const mockContext = {
        useAuth: jest.fn(() => ({
          loading: false,
          isAuthenticated: undefined
        }))
      };
      AuthContext.useAuth = mockContext.useAuth;
      
      renderWithRouter(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        '/protected'
      );
      
      // Should redirect since isAuthenticated is falsy
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  describe('Authentication State Transitions', () => {
    test('should transition from loading to authenticated', async () => {
      AuthContext.useAuth = mockAuthContextLoading.useAuth;
      
      const { rerender } = renderWithRouter(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        '/protected'
      );
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      
      // Simulate authentication completing
      AuthContext.useAuth = mockAuthContextAuthenticated.useAuth;
      
      rerender(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/login" element={<div>Login Page</div>} />
            <Route 
              path="/protected" 
              element={
                <ProtectedRoute>
                  <div>Protected Content</div>
                </ProtectedRoute>
              } 
            />
          </Routes>
        </MemoryRouter>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument();
      });
    });

    test('should transition from loading to unauthenticated', async () => {
      AuthContext.useAuth = mockAuthContextLoading.useAuth;
      
      const { rerender } = renderWithRouter(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        '/protected'
      );
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      
      // Simulate authentication failing
      AuthContext.useAuth = mockAuthContextUnauthenticated.useAuth;
      
      rerender(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/login" element={<div>Login Page</div>} />
            <Route 
              path="/protected" 
              element={
                <ProtectedRoute>
                  <div>Protected Content</div>
                </ProtectedRoute>
              } 
            />
          </Routes>
        </MemoryRouter>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });
    });

    test('should transition from authenticated to unauthenticated', async () => {
      AuthContext.useAuth = mockAuthContextAuthenticated.useAuth;
      
      const { rerender } = renderWithRouter(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        '/protected'
      );
      
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      
      // Simulate logout
      AuthContext.useAuth = mockAuthContextUnauthenticated.useAuth;
      
      rerender(
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/login" element={<div>Login Page</div>} />
            <Route 
              path="/protected" 
              element={
                <ProtectedRoute>
                  <div>Protected Content</div>
                </ProtectedRoute>
              } 
            />
          </Routes>
        </MemoryRouter>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Login Page')).toBeInTheDocument();
      });
    });
  });

  describe('Multiple Protected Routes', () => {
    test('should protect multiple routes independently', () => {
      AuthContext.useAuth = mockAuthContextAuthenticated.useAuth;
      
      render(
        <MemoryRouter initialEntries={['/protected1']}>
          <Routes>
            <Route path="/login" element={<div>Login Page</div>} />
            <Route 
              path="/protected1" 
              element={
                <ProtectedRoute>
                  <div>Protected 1</div>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/protected2" 
              element={
                <ProtectedRoute>
                  <div>Protected 2</div>
                </ProtectedRoute>
              } 
            />
          </Routes>
        </MemoryRouter>
      );
      
      expect(screen.getByText('Protected 1')).toBeInTheDocument();
      expect(screen.queryByText('Protected 2')).not.toBeInTheDocument();
    });
  });

  describe('Console Logging', () => {
    test('should log authentication status', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      AuthContext.useAuth = mockAuthContextAuthenticated.useAuth;
      
      renderWithRouter(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        '/protected'
      );
      
      expect(consoleSpy).toHaveBeenCalledWith('Authenticated: true');
      
      consoleSpy.mockRestore();
    });

    test('should log false when not authenticated', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      AuthContext.useAuth = mockAuthContextUnauthenticated.useAuth;
      
      renderWithRouter(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>,
        '/protected'
      );
      
      expect(consoleSpy).toHaveBeenCalledWith('Authenticated: false');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Integration', () => {
    test('should work with nested components', () => {
      AuthContext.useAuth = mockAuthContextAuthenticated.useAuth;
      
      const NestedComponent = () => (
        <div>
          <h1>Nested</h1>
          <div>
            <p>Deep Content</p>
          </div>
        </div>
      );
      
      renderWithRouter(
        <ProtectedRoute>
          <NestedComponent />
        </ProtectedRoute>,
        '/protected'
      );
      
      expect(screen.getByText('Nested')).toBeInTheDocument();
      expect(screen.getByText('Deep Content')).toBeInTheDocument();
    });

    test('should preserve component props', () => {
      AuthContext.useAuth = mockAuthContextAuthenticated.useAuth;
      
      const ComponentWithProps = ({ title, count }) => (
        <div>
          <h1>{title}</h1>
          <p>Count: {count}</p>
        </div>
      );
      
      renderWithRouter(
        <ProtectedRoute>
          <ComponentWithProps title="Test" count={42} />
        </ProtectedRoute>,
        '/protected'
      );
      
      expect(screen.getByText('Test')).toBeInTheDocument();
      expect(screen.getByText('Count: 42')).toBeInTheDocument();
    });

    test('should work with stateful components', () => {
      AuthContext.useAuth = mockAuthContextAuthenticated.useAuth;
      
      const StatefulComponent = () => {
        const [count, setCount] = React.useState(0);
        return (
          <div>
            <p>Count: {count}</p>
            <button onClick={() => setCount(count + 1)}>Increment</button>
          </div>
        );
      };
      
      renderWithRouter(
        <ProtectedRoute>
          <StatefulComponent />
        </ProtectedRoute>,
        '/protected'
      );
      
      expect(screen.getByText('Count: 0')).toBeInTheDocument();
    });
  });
});
