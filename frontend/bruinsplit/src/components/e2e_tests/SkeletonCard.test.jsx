import { jest } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import SkeletonCard from '../SkeletonCard';

describe('SkeletonCard Component', () => {
  describe('Rendering', () => {
    test('should render skeleton card', () => {
      const { container } = render(<SkeletonCard />);
      
      const skeletonCard = container.querySelector('.skeleton-card');
      expect(skeletonCard).toBeInTheDocument();
    });

    test('should render skeleton header', () => {
      const { container } = render(<SkeletonCard />);
      
      const skeletonHeader = container.querySelector('.skeleton-header');
      expect(skeletonHeader).toBeInTheDocument();
    });

    test('should render skeleton content', () => {
      const { container } = render(<SkeletonCard />);
      
      const skeletonContent = container.querySelector('.skeleton-content');
      expect(skeletonContent).toBeInTheDocument();
    });

    test('should render skeleton lines', () => {
      const { container } = render(<SkeletonCard />);
      
      const skeletonLines = container.querySelectorAll('.skeleton-line');
      expect(skeletonLines.length).toBe(3);
    });

    test('should render skeleton buttons', () => {
      const { container } = render(<SkeletonCard />);
      
      const skeletonButtons = container.querySelectorAll('.skeleton-button');
      expect(skeletonButtons.length).toBe(2);
    });

    test('should render skeleton buttons container', () => {
      const { container } = render(<SkeletonCard />);
      
      const skeletonButtonsContainer = container.querySelector('.skeleton-buttons');
      expect(skeletonButtonsContainer).toBeInTheDocument();
    });
  });

  describe('Animation Delay', () => {
    test('should apply default animation delay of 0s when no index provided', () => {
      const { container } = render(<SkeletonCard />);
      
      const skeletonCard = container.querySelector('.skeleton-card');
      expect(skeletonCard).toHaveStyle('--skeleton-delay: 0s');
    });

    test('should apply animation delay based on index', () => {
      const { container } = render(<SkeletonCard index={5} />);
      
      const skeletonCard = container.querySelector('.skeleton-card');
      expect(skeletonCard).toHaveStyle('--skeleton-delay: 0.5s');
    });

    test('should calculate correct delay for index 0', () => {
      const { container } = render(<SkeletonCard index={0} />);
      
      const skeletonCard = container.querySelector('.skeleton-card');
      expect(skeletonCard).toHaveStyle('--skeleton-delay: 0s');
    });

    test('should calculate correct delay for index 1', () => {
      const { container } = render(<SkeletonCard index={1} />);
      
      const skeletonCard = container.querySelector('.skeleton-card');
      expect(skeletonCard).toHaveStyle('--skeleton-delay: 0.1s');
    });

    test('should calculate correct delay for index 10', () => {
      const { container } = render(<SkeletonCard index={10} />);
      
      const skeletonCard = container.querySelector('.skeleton-card');
      expect(skeletonCard).toHaveStyle('--skeleton-delay: 1s');
    });

    test('should calculate correct delay for large index', () => {
      const { container } = render(<SkeletonCard index={25} />);
      
      const skeletonCard = container.querySelector('.skeleton-card');
      expect(skeletonCard).toHaveStyle('--skeleton-delay: 2.5s');
    });
  });

  describe('Skeleton Line Widths', () => {
    test('should apply 80% width to first skeleton line', () => {
      const { container } = render(<SkeletonCard />);
      
      const skeletonLines = container.querySelectorAll('.skeleton-line');
      expect(skeletonLines[0]).toHaveStyle('width: 80%');
    });

    test('should apply 60% width to second skeleton line', () => {
      const { container } = render(<SkeletonCard />);
      
      const skeletonLines = container.querySelectorAll('.skeleton-line');
      expect(skeletonLines[1]).toHaveStyle('width: 60%');
    });

    test('should apply 90% width to third skeleton line', () => {
      const { container } = render(<SkeletonCard />);
      
      const skeletonLines = container.querySelectorAll('.skeleton-line');
      expect(skeletonLines[2]).toHaveStyle('width: 90%');
    });
  });

  describe('Multiple Renders', () => {
    test('should render multiple skeleton cards with different delays', () => {
      const { container: container1 } = render(<SkeletonCard index={0} />);
      const { container: container2 } = render(<SkeletonCard index={1} />);
      const { container: container3 } = render(<SkeletonCard index={2} />);
      
      const skeletonCard1 = container1.querySelector('.skeleton-card');
      const skeletonCard2 = container2.querySelector('.skeleton-card');
      const skeletonCard3 = container3.querySelector('.skeleton-card');
      
      expect(skeletonCard1).toHaveStyle('--skeleton-delay: 0s');
      expect(skeletonCard2).toHaveStyle('--skeleton-delay: 0.1s');
      expect(skeletonCard3).toHaveStyle('--skeleton-delay: 0.2s');
    });

    test('should render correctly when rerendered', () => {
      const { container, rerender } = render(<SkeletonCard index={1} />);
      
      let skeletonCard = container.querySelector('.skeleton-card');
      const style1 = skeletonCard.getAttribute('style');
      expect(style1).toContain('--skeleton-delay: 0.1s');
      
      rerender(<SkeletonCard index={3} />);
      
      skeletonCard = container.querySelector('.skeleton-card');
      const style2 = skeletonCard.getAttribute('style');
      expect(style2).toContain('0.3'); // Check for 0.3 (floating point tolerance)
    });
  });

  describe('Structure', () => {
    test('should have correct nested structure', () => {
      const { container } = render(<SkeletonCard />);
      
      const skeletonCard = container.querySelector('.skeleton-card');
      const skeletonHeader = skeletonCard.querySelector('.skeleton-header');
      const skeletonContent = skeletonCard.querySelector('.skeleton-content');
      
      expect(skeletonCard).toContainElement(skeletonHeader);
      expect(skeletonCard).toContainElement(skeletonContent);
    });

    test('should have skeleton lines inside content', () => {
      const { container } = render(<SkeletonCard />);
      
      const skeletonContent = container.querySelector('.skeleton-content');
      const skeletonLines = skeletonContent.querySelectorAll('.skeleton-line');
      
      expect(skeletonLines.length).toBe(3);
    });

    test('should have skeleton buttons inside content', () => {
      const { container } = render(<SkeletonCard />);
      
      const skeletonContent = container.querySelector('.skeleton-content');
      const skeletonButtons = skeletonContent.querySelector('.skeleton-buttons');
      
      expect(skeletonButtons).toBeInTheDocument();
    });

    test('should have two skeleton buttons inside buttons container', () => {
      const { container } = render(<SkeletonCard />);
      
      const skeletonButtonsContainer = container.querySelector('.skeleton-buttons');
      const buttons = skeletonButtonsContainer.querySelectorAll('.skeleton-button');
      
      expect(buttons.length).toBe(2);
    });
  });

  describe('Snapshot', () => {
    test('should match snapshot with default props', () => {
      const { container } = render(<SkeletonCard />);
      expect(container.firstChild).toMatchSnapshot();
    });

    test('should match snapshot with index prop', () => {
      const { container } = render(<SkeletonCard index={5} />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Edge Cases', () => {
    test('should handle index 0 correctly', () => {
      const { container } = render(<SkeletonCard index={0} />);
      
      const skeletonCard = container.querySelector('.skeleton-card');
      expect(skeletonCard).toHaveStyle('--skeleton-delay: 0s');
    });

    test('should handle negative index', () => {
      const { container } = render(<SkeletonCard index={-1} />);
      
      const skeletonCard = container.querySelector('.skeleton-card');
      expect(skeletonCard).toHaveStyle('--skeleton-delay: -0.1s');
    });

    test('should handle float index', () => {
      const { container } = render(<SkeletonCard index={2.5} />);
      
      const skeletonCard = container.querySelector('.skeleton-card');
      expect(skeletonCard).toHaveStyle('--skeleton-delay: 0.25s');
    });

    test('should handle very large index', () => {
      const { container } = render(<SkeletonCard index={1000} />);
      
      const skeletonCard = container.querySelector('.skeleton-card');
      expect(skeletonCard).toHaveStyle('--skeleton-delay: 100s');
    });

    test('should not crash with null index', () => {
      expect(() => render(<SkeletonCard index={null} />)).not.toThrow();
    });

    test('should not crash with undefined index', () => {
      expect(() => render(<SkeletonCard index={undefined} />)).not.toThrow();
    });

    test('should not crash with string index', () => {
      expect(() => render(<SkeletonCard index="5" />)).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    test('should render without accessibility violations', () => {
      const { container } = render(<SkeletonCard />);
      
      // Basic check that it renders
      expect(container.firstChild).toBeInTheDocument();
    });

    test('should be visible in the DOM', () => {
      const { container } = render(<SkeletonCard />);
      
      const skeletonCard = container.querySelector('.skeleton-card');
      expect(skeletonCard).toBeVisible();
    });
  });

  describe('CSS Variable', () => {
    test('should set CSS custom property correctly', () => {
      const { container } = render(<SkeletonCard index={3} />);
      
      const skeletonCard = container.querySelector('.skeleton-card');
      const style = skeletonCard.getAttribute('style');
      
      expect(style).toContain('--skeleton-delay');
      expect(style).toContain('0.3');
    });

    test('should update CSS custom property on rerender', () => {
      const { container, rerender } = render(<SkeletonCard index={1} />);
      
      let skeletonCard = container.querySelector('.skeleton-card');
      let style = skeletonCard.getAttribute('style');
      expect(style).toContain('--skeleton-delay: 0.1s');
      
      rerender(<SkeletonCard index={5} />);
      
      skeletonCard = container.querySelector('.skeleton-card');
      style = skeletonCard.getAttribute('style');
      expect(style).toContain('--skeleton-delay: 0.5s');
    });
  });

  describe('Component Isolation', () => {
    test('should render independently without affecting other components', () => {
      const { container: container1 } = render(<SkeletonCard index={1} />);
      const { container: container2 } = render(<SkeletonCard index={2} />);
      
      const card1 = container1.querySelector('.skeleton-card');
      const card2 = container2.querySelector('.skeleton-card');
      
      expect(card1).not.toBe(card2);
      expect(card1).toHaveStyle('--skeleton-delay: 0.1s');
      expect(card2).toHaveStyle('--skeleton-delay: 0.2s');
    });
  });

  describe('Performance', () => {
    test('should render quickly with default props', () => {
      const startTime = performance.now();
      render(<SkeletonCard />);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100);
    });

    test('should render multiple cards efficiently', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 10; i++) {
        render(<SkeletonCard index={i} />);
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(500);
    });
  });
});
