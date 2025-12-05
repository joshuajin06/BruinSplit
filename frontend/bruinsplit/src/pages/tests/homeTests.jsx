import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Home from '../Home';

// Mock the useNavigate hook
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Home Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders main heading correctly', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Split rides/i)).toBeInTheDocument();
    expect(screen.getByText(/Save money/i)).toBeInTheDocument();
  });

  it('renders search input and button', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );
    
    const searchInput = screen.getByPlaceholderText(/Where are you heading?/i);
    const searchButton = screen.getByRole('button', { name: /search/i });
    
    expect(searchInput).toBeInTheDocument();
    expect(searchButton).toBeInTheDocument();
  });

  it('navigates to postings when search button is clicked', async () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );
    
    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/postings');
    });
  });

  it('navigates with query parameter when search has value', async () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );
    
    const searchInput = screen.getByPlaceholderText(/Where are you heading?/i);
    const searchButton = screen.getByRole('button', { name: /search/i });
    
    fireEvent.change(searchInput, { target: { value: 'LAX' } });
    fireEvent.click(searchButton);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/postings?q=LAX');
    });
  });

  it('handles Enter key press in search input', async () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );
    
    const searchInput = screen.getByPlaceholderText(/Where are you heading?/i);
    
    fireEvent.change(searchInput, { target: { value: 'Airport' } });
    fireEvent.keyPress(searchInput, { key: 'Enter', code: 'Enter', charCode: 13 });
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/postings?q=Airport');
    });
  });

  it('renders feature cards', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Search/i)).toBeInTheDocument();
    expect(screen.getByText(/Connect/i)).toBeInTheDocument();
    expect(screen.getByText(/Split/i)).toBeInTheDocument();
  });

  it('renders Get Started button and navigates on click', async () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );
    
    const getStartedButton = screen.getByRole('button', { name: /get started/i });
    fireEvent.click(getStartedButton);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/postings');
    });
  });
});