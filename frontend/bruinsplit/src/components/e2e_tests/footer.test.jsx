import { jest } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import Footer from '../footer';

describe('Footer Component', () => {
  describe('Rendering', () => {
    test('should render footer element', () => {
      render(<Footer />);
      
      const footer = screen.getByRole('contentinfo');
      expect(footer).toBeInTheDocument();
    });

    test('should display copyright text', () => {
      render(<Footer />);
      
      expect(screen.getByText(/BruinSplit. All rights reserved./i)).toBeInTheDocument();
    });

    test('should display copyright symbol', () => {
      render(<Footer />);
      
      expect(screen.getByText(/©/)).toBeInTheDocument();
    });

    test('should contain paragraph element', () => {
      const { container } = render(<Footer />);
      
      const paragraph = container.querySelector('p');
      expect(paragraph).toBeInTheDocument();
    });
  });

  describe('Dynamic Year Display', () => {
    test('should display current year', () => {
      const currentYear = new Date().getFullYear();
      render(<Footer />);
      
      expect(screen.getByText(new RegExp(`© ${currentYear}`))).toBeInTheDocument();
    });

    test('should update year dynamically', () => {
      // Simply verify that the footer contains a 4-digit year
      render(<Footer />);
      
      const footer = screen.getByRole('contentinfo');
      // Check that it contains a 4-digit year between 2024-2030
      expect(footer.textContent).toMatch(/©\s+(202[4-9]|203[0-9])/);
    });

    test('should match exact copyright format', () => {
      const currentYear = new Date().getFullYear();
      render(<Footer />);
      
      const expectedText = `© ${currentYear} BruinSplit. All rights reserved.`;
      expect(screen.getByText(expectedText)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have semantic footer element', () => {
      render(<Footer />);
      
      const footer = screen.getByRole('contentinfo');
      expect(footer.tagName).toBe('FOOTER');
    });

    test('should be accessible via role', () => {
      render(<Footer />);
      
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });
  });

  describe('Snapshot', () => {
    test('should match snapshot', () => {
      const { container } = render(<Footer />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Content Verification', () => {
    test('should contain "BruinSplit" text', () => {
      render(<Footer />);
      
      expect(screen.getByText(/BruinSplit/)).toBeInTheDocument();
    });

    test('should contain "All rights reserved" text', () => {
      render(<Footer />);
      
      expect(screen.getByText(/All rights reserved/)).toBeInTheDocument();
    });

    test('should have complete copyright notice', () => {
      render(<Footer />);
      
      const footer = screen.getByRole('contentinfo');
      expect(footer.textContent).toMatch(/© \d{4} BruinSplit. All rights reserved./);
    });
  });

  describe('Styling', () => {
    test('should render without errors', () => {
      expect(() => render(<Footer />)).not.toThrow();
    });

    test('should have only one child element (paragraph)', () => {
      const { container } = render(<Footer />);
      const footer = container.querySelector('footer');
      
      expect(footer.children).toHaveLength(1);
      expect(footer.children[0].tagName).toBe('P');
    });
  });

  describe('Edge Cases', () => {
    test('should handle year transition correctly', () => {
      // Simulate New Year's Eve
      const mockDate = new Date('2024-12-31T23:59:59');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
      
      render(<Footer />);
      expect(screen.getByText(/© 2024/)).toBeInTheDocument();
      
      global.Date.mockRestore();
    });

    test('should render correctly at start of year', () => {
      const mockDate = new Date('2025-01-01T00:00:01');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
      
      render(<Footer />);
      expect(screen.getByText(/© 2025/)).toBeInTheDocument();
      
      global.Date.mockRestore();
    });

    test('should handle leap year correctly', () => {
      const mockDate = new Date('2024-02-29T12:00:00');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
      
      render(<Footer />);
      expect(screen.getByText(/© 2024/)).toBeInTheDocument();
      
      global.Date.mockRestore();
    });
  });

  describe('Multiple Renders', () => {
    test('should render consistently across multiple renders', () => {
      const { rerender } = render(<Footer />);
      const firstRender = screen.getByRole('contentinfo').textContent;
      
      rerender(<Footer />);
      const secondRender = screen.getByRole('contentinfo').textContent;
      
      expect(firstRender).toBe(secondRender);
    });

    test('should always show current year on re-render', () => {
      const currentYear = new Date().getFullYear();
      const { rerender } = render(<Footer />);
      
      expect(screen.getByText(new RegExp(`© ${currentYear}`))).toBeInTheDocument();
      
      rerender(<Footer />);
      expect(screen.getByText(new RegExp(`© ${currentYear}`))).toBeInTheDocument();
    });
  });
});
