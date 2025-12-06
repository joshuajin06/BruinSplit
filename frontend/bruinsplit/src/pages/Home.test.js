import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from './Home'; // Assuming Home.jsx is in the same directory
import { BrowserRouter } from 'react-router-dom';

// Mock the useNavigate hook from react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'), // Import and retain default behavior
  useNavigate: () => mockNavigate, // Mock useNavigate
}));

describe('Home Component', () => {
  // Clear mock calls before each test to ensure isolation
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  const renderHome = () => {
    return render(
        <BrowserRouter>
            <Home />
        </BrowserRouter>
    )
  }

  test('renders the main heading and sub-heading', async () => {
    renderHome();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Split rides\. Save money\./i })).toBeInTheDocument();
      expect(screen.getByText(/Cheaper travels to LAX, Rose Bowl, Santa Monica, downtown, and more\. Safe and simple\./i)).toBeInTheDocument();
    });
  });

  test('renders the search input and button', async () => {
    renderHome();
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Where are you heading\?/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Search/i })).toBeInTheDocument();
    });
  });

  test('updates search query on input change', async () => {
    renderHome();
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/Where are you heading\?/i);
      fireEvent.change(searchInput, { target: { value: 'LAX' } });
      expect(searchInput).toHaveValue('LAX');
    });
  });

  test('navigates to /postings with query when search button is clicked with input', async () => {
    renderHome();
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/Where are you heading\?/i);
      fireEvent.change(searchInput, { target: { value: 'Santa Monica' } });

      const searchButton = screen.getByRole('button', { name: /Search/i });
      fireEvent.click(searchButton);

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/postings?q=Santa%20Monica');
    });
  });

  test('navigates to /postings without query when search button is clicked with empty input', async () => {
    renderHome();
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/Where are you heading\?/i);
      fireEvent.change(searchInput, { target: { value: '' } }); // Ensure input is empty

      const searchButton = screen.getByRole('button', { name: /Search/i });
      fireEvent.click(searchButton);

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/postings');
    });
  });

  test('navigates to /postings with query when Enter key is pressed in input', async () => {
    renderHome();
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/Where are you heading\?/i);
      fireEvent.change(searchInput, { target: { value: 'Rose Bowl' } });
      fireEvent.keyPress(searchInput, { key: 'Enter', code: 'Enter', charCode: 13 });

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/postings?q=Rose%20Bowl');
    });
  });

  test('navigates to /postings when "Get Started" button is clicked', async () => {
    renderHome();
    await waitFor(() => {
      const getStartedButton = screen.getByRole('button', { name: /Get Started/i });
      fireEvent.click(getStartedButton);

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/postings');
    });
  });

  test('renders "How it works" section with features', async () => {
    renderHome();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /How it works/i })).toBeInTheDocument();
      expect(screen.getByText(/Seamless ride sharing designed for students\./i)).toBeInTheDocument();
      expect(screen.getAllByText(/Search/i)[0]).toBeInTheDocument();
      expect(screen.getByText(/Connect/i)).toBeInTheDocument();
      expect(screen.getByText(/Split/i)).toBeInTheDocument();
    });
  });

  test('renders the Call to Action section', async () => {
    renderHome();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Ready to go\?/i })).toBeInTheDocument();
      expect(screen.getByText(/Join the community today\./i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Get Started/i })).toBeInTheDocument();
    });
  });
});