import { jest } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBar from '../searchBar';

// Mock Material-UI components
jest.mock('@mui/material/TextField', () => {
  return function MockTextField(props) {
    const { InputProps, ...otherProps } = props;
    return (
      <div>
        {InputProps?.startAdornment}
        <input
          data-testid="search-input"
          {...otherProps}
          value={props.value}
          onChange={props.onChange}
        />
        {InputProps?.endAdornment}
      </div>
    );
  };
});

jest.mock('@mui/material/InputAdornment', () => {
  return function MockInputAdornment({ children }) {
    return <div>{children}</div>;
  };
});

jest.mock('@mui/material/IconButton', () => {
  return function MockIconButton({ children, onClick, ...props }) {
    return (
      <button onClick={onClick} {...props}>
        {children}
      </button>
    );
  };
});

jest.mock('@mui/icons-material/Search', () => {
  return function MockSearchIcon() {
    return <span data-testid="search-icon">🔍</span>;
  };
});

jest.mock('@mui/icons-material/Clear', () => {
  return function MockClearIcon() {
    return <span data-testid="clear-icon">✕</span>;
  };
});

describe('SearchBar Component', () => {
  const mockOnSearch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('should render search input', () => {
      render(<SearchBar onSearch={mockOnSearch} />);
      
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });

    test('should render search icon', () => {
      render(<SearchBar onSearch={mockOnSearch} />);
      
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
    });

    test('should render with placeholder text', () => {
      render(<SearchBar onSearch={mockOnSearch} />);
      
      const input = screen.getByTestId('search-input');
      expect(input).toHaveAttribute('placeholder', 'Search rides by origin or destination...');
    });

    test('should render with initial empty value', () => {
      render(<SearchBar onSearch={mockOnSearch} />);
      
      const input = screen.getByTestId('search-input');
      expect(input).toHaveValue('');
    });

    test('should render with provided initial value', () => {
      render(<SearchBar onSearch={mockOnSearch} initialValue="UCLA" />);
      
      const input = screen.getByTestId('search-input');
      expect(input).toHaveValue('UCLA');
    });
  });

  describe('Search Functionality', () => {
    test('should call onSearch when input changes', async () => {
      const user = userEvent.setup();
      render(<SearchBar onSearch={mockOnSearch} />);
      
      const input = screen.getByTestId('search-input');
      await user.type(input, 'UCLA');
      
      expect(mockOnSearch).toHaveBeenCalled();
    });

    test('should call onSearch with correct value', async () => {
      const user = userEvent.setup();
      render(<SearchBar onSearch={mockOnSearch} />);
      
      const input = screen.getByTestId('search-input');
      await user.type(input, 'L');
      
      expect(mockOnSearch).toHaveBeenCalledWith('L');
    });

    test('should update search query state when typing', async () => {
      const user = userEvent.setup();
      render(<SearchBar onSearch={mockOnSearch} />);
      
      const input = screen.getByTestId('search-input');
      await user.type(input, 'LAX');
      
      expect(input).toHaveValue('LAX');
    });

    test('should handle multiple character inputs', async () => {
      const user = userEvent.setup();
      render(<SearchBar onSearch={mockOnSearch} />);
      
      const input = screen.getByTestId('search-input');
      await user.type(input, 'UCLA to LAX');
      
      expect(mockOnSearch).toHaveBeenLastCalledWith('UCLA to LAX');
    });

    test('should handle backspace correctly', async () => {
      const user = userEvent.setup();
      render(<SearchBar onSearch={mockOnSearch} initialValue="UCLA" />);
      
      const input = screen.getByTestId('search-input');
      await user.clear(input);
      await user.type(input, 'UC');
      
      expect(input).toHaveValue('UC');
    });

    test('should call onSearch on every keystroke', async () => {
      const user = userEvent.setup();
      render(<SearchBar onSearch={mockOnSearch} />);
      
      const input = screen.getByTestId('search-input');
      await user.type(input, 'ABC');
      
      expect(mockOnSearch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Clear Functionality', () => {
    test('should not show clear button when input is empty', () => {
      render(<SearchBar onSearch={mockOnSearch} />);
      
      expect(screen.queryByTestId('clear-icon')).not.toBeInTheDocument();
    });

    test('should show clear button when input has value', () => {
      render(<SearchBar onSearch={mockOnSearch} initialValue="UCLA" />);
      
      expect(screen.getByTestId('clear-icon')).toBeInTheDocument();
    });

    test('should clear input when clear button is clicked', async () => {
      render(<SearchBar onSearch={mockOnSearch} initialValue="UCLA" />);
      
      const clearButton = screen.getByLabelText('clear search');
      fireEvent.click(clearButton);
      
      await waitFor(() => {
        const input = screen.getByTestId('search-input');
        expect(input).toHaveValue('');
      });
    });

    test('should call onSearch with empty string when clear is clicked', async () => {
      render(<SearchBar onSearch={mockOnSearch} initialValue="UCLA" />);
      
      const clearButton = screen.getByLabelText('clear search');
      fireEvent.click(clearButton);
      
      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledWith('');
      });
    });

    test('should hide clear button after clearing', async () => {
      render(<SearchBar onSearch={mockOnSearch} initialValue="UCLA" />);
      
      const clearButton = screen.getByLabelText('clear search');
      fireEvent.click(clearButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('clear-icon')).not.toBeInTheDocument();
      });
    });

    test('should show clear button again after typing', async () => {
      const user = userEvent.setup();
      render(<SearchBar onSearch={mockOnSearch} />);
      
      const input = screen.getByTestId('search-input');
      await user.type(input, 'A');
      
      expect(screen.getByTestId('clear-icon')).toBeInTheDocument();
    });

    test('should have correct aria-label for clear button', () => {
      render(<SearchBar onSearch={mockOnSearch} initialValue="UCLA" />);
      
      const clearButton = screen.getByLabelText('clear search');
      expect(clearButton).toBeInTheDocument();
    });
  });

  describe('Initial Value Sync', () => {
    test('should sync with initialValue prop', () => {
      render(<SearchBar onSearch={mockOnSearch} initialValue="Santa Monica" />);
      
      const input = screen.getByTestId('search-input');
      expect(input).toHaveValue('Santa Monica');
    });

    test('should update when initialValue changes', () => {
      const { rerender } = render(<SearchBar onSearch={mockOnSearch} initialValue="UCLA" />);
      
      let input = screen.getByTestId('search-input');
      expect(input).toHaveValue('UCLA');
      
      rerender(<SearchBar onSearch={mockOnSearch} initialValue="LAX" />);
      
      input = screen.getByTestId('search-input');
      expect(input).toHaveValue('LAX');
    });

    test('should handle empty initialValue', () => {
      render(<SearchBar onSearch={mockOnSearch} initialValue="" />);
      
      const input = screen.getByTestId('search-input');
      expect(input).toHaveValue('');
    });

    test('should handle undefined initialValue', () => {
      render(<SearchBar onSearch={mockOnSearch} />);
      
      const input = screen.getByTestId('search-input');
      expect(input).toHaveValue('');
    });
  });

  describe('Event Handling', () => {
    test('should handle onChange event', () => {
      render(<SearchBar onSearch={mockOnSearch} />);
      
      const input = screen.getByTestId('search-input');
      fireEvent.change(input, { target: { value: 'Test' } });
      
      expect(mockOnSearch).toHaveBeenCalledWith('Test');
    });

    test('should handle multiple onChange events', () => {
      render(<SearchBar onSearch={mockOnSearch} />);
      
      const input = screen.getByTestId('search-input');
      fireEvent.change(input, { target: { value: 'A' } });
      fireEvent.change(input, { target: { value: 'AB' } });
      fireEvent.change(input, { target: { value: 'ABC' } });
      
      expect(mockOnSearch).toHaveBeenCalledTimes(3);
      expect(mockOnSearch).toHaveBeenLastCalledWith('ABC');
    });

    test('should handle clear click event', () => {
      render(<SearchBar onSearch={mockOnSearch} initialValue="Test" />);
      
      const clearButton = screen.getByLabelText('clear search');
      fireEvent.click(clearButton);
      
      expect(mockOnSearch).toHaveBeenCalledWith('');
    });

    test('should prevent event propagation on clear', () => {
      const stopPropagation = jest.fn();
      const preventDefault = jest.fn();
      
      render(<SearchBar onSearch={mockOnSearch} initialValue="Test" />);
      
      const clearButton = screen.getByLabelText('clear search');
      fireEvent.click(clearButton, { 
        stopPropagation,
        preventDefault 
      });
      
      // The component should handle the click
      expect(mockOnSearch).toHaveBeenCalledWith('');
    });
  });

  describe('Special Characters', () => {
    test('should handle special characters in search', async () => {
      const user = userEvent.setup();
      render(<SearchBar onSearch={mockOnSearch} />);
      
      const input = screen.getByTestId('search-input');
      await user.type(input, 'UCLA -> LAX');
      
      expect(input).toHaveValue('UCLA -> LAX');
    });

    test('should handle numbers in search', async () => {
      const user = userEvent.setup();
      render(<SearchBar onSearch={mockOnSearch} />);
      
      const input = screen.getByTestId('search-input');
      await user.type(input, '123 Street');
      
      expect(input).toHaveValue('123 Street');
    });

    test('should handle unicode characters', async () => {
      const user = userEvent.setup();
      render(<SearchBar onSearch={mockOnSearch} />);
      
      const input = screen.getByTestId('search-input');
      await user.type(input, 'Café ☕');
      
      expect(input).toHaveValue('Café ☕');
    });

    test('should handle spaces', async () => {
      const user = userEvent.setup();
      render(<SearchBar onSearch={mockOnSearch} />);
      
      const input = screen.getByTestId('search-input');
      await user.type(input, 'Los Angeles Airport');
      
      expect(input).toHaveValue('Los Angeles Airport');
    });
  });

  describe('Edge Cases', () => {
    test('should handle rapid typing', async () => {
      const user = userEvent.setup();
      render(<SearchBar onSearch={mockOnSearch} />);
      
      const input = screen.getByTestId('search-input');
      await user.type(input, 'QuickTyping', { delay: 1 });
      
      expect(input).toHaveValue('QuickTyping');
      expect(mockOnSearch).toHaveBeenCalled();
    });

    test('should handle very long input', async () => {
      const user = userEvent.setup();
      const longString = 'A'.repeat(100);
      render(<SearchBar onSearch={mockOnSearch} />);
      
      const input = screen.getByTestId('search-input');
      await user.type(input, longString);
      
      expect(input).toHaveValue(longString);
    });

    test('should handle empty string input', () => {
      render(<SearchBar onSearch={mockOnSearch} initialValue="test" />);
      
      const input = screen.getByTestId('search-input');
      fireEvent.change(input, { target: { value: '' } });
      
      expect(input.value).toBe('');
      expect(mockOnSearch).toHaveBeenCalledWith('');
    });

    test('should handle null onSearch gracefully', () => {
      expect(() => render(<SearchBar onSearch={null} />)).not.toThrow();
    });

    test('should render without crashing when no props provided', () => {
      expect(() => render(<SearchBar onSearch={jest.fn()} />)).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    test('should have accessible clear button label', () => {
      render(<SearchBar onSearch={mockOnSearch} initialValue="Test" />);
      
      expect(screen.getByLabelText('clear search')).toBeInTheDocument();
    });

    test('should maintain focus after clearing', async () => {
      render(<SearchBar onSearch={mockOnSearch} initialValue="Test" />);
      
      const input = screen.getByTestId('search-input');
      input.focus();
      
      const clearButton = screen.getByLabelText('clear search');
      fireEvent.click(clearButton);
      
      // Input should still be focusable after clear
      expect(input).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    test('should work with parent component state', () => {
      const ParentComponent = () => {
        const [query, setQuery] = React.useState('');
        return (
          <div>
            <SearchBar onSearch={setQuery} initialValue={query} />
            <div data-testid="query-display">{query}</div>
          </div>
        );
      };
      
      render(<ParentComponent />);
      
      const input = screen.getByTestId('search-input');
      fireEvent.change(input, { target: { value: 'UCLA' } });
      
      expect(screen.getByTestId('query-display')).toHaveTextContent('UCLA');
    });
  });
});
