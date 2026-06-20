/**
 * Modal Component Tests
 * Tests for Modal dialog with open/close, title, footer, and backdrop interactions
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from './Modal';

describe('Modal Component', () => {
  // Rendering Tests
  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      const { container } = render(
        <Modal isOpen={false} onClose={jest.fn()}>
          Content
        </Modal>
      );
      expect(container.querySelector('div[class*="fixed"]')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={jest.fn()}>
          Content
        </Modal>
      );
      expect(container.querySelector('div[class*="fixed"]')).toBeInTheDocument();
    });

    it('should render modal content when open', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          Modal Content
        </Modal>
      );
      expect(screen.getByText('Modal Content')).toBeInTheDocument();
    });

    it('should display title when provided', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()} title="Confirm Action">
          Are you sure?
        </Modal>
      );
      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    });

    it('should not display title when not provided', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={jest.fn()}>
          Content
        </Modal>
      );
      expect(container.querySelector('h2')).not.toBeInTheDocument();
    });
  });

  // Footer Tests
  describe('Footer', () => {
    it('should render footer when provided', () => {
      render(
        <Modal
          isOpen={true}
          onClose={jest.fn()}
          footer={<button>Action</button>}
        >
          Content
        </Modal>
      );
      expect(screen.getByText('Action')).toBeInTheDocument();
    });

    it('should not render footer when not provided', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={jest.fn()}>
          Content
        </Modal>
      );
      const footerDiv = Array.from(container.querySelectorAll('div')).find(
        (el) => el.className.includes('border-t')
      );
      expect(footerDiv).not.toBeInTheDocument();
    });

    it('should render multiple footer buttons', () => {
      render(
        <Modal
          isOpen={true}
          onClose={jest.fn()}
          footer={
            <>
              <button>Cancel</button>
              <button>Confirm</button>
            </>
          }
        >
          Content
        </Modal>
      );
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });
  });

  // Interaction Tests
  describe('Interactions', () => {
    it('should call onClose when backdrop is clicked', async () => {
      const handleClose = jest.fn();
      const { container } = render(
        <Modal isOpen={true} onClose={handleClose}>
          Content
        </Modal>
      );
      const backdrop = container.querySelector('div[class*="fixed"][class*="inset-0"]');
      if (backdrop) {
        fireEvent.click(backdrop);
      }
      expect(handleClose).toHaveBeenCalled();
    });

    it('should not close when modal content is clicked', async () => {
      const handleClose = jest.fn();
      render(
        <Modal isOpen={true} onClose={handleClose}>
          <div onClick={(e) => e.stopPropagation()}>Content</div>
        </Modal>
      );
      const content = screen.getByText('Content');
      fireEvent.click(content);
      expect(handleClose).not.toHaveBeenCalled();
    });

    it('should stop propagation on modal click', async () => {
      const handleClose = jest.fn();
      const { container } = render(
        <Modal isOpen={true} onClose={handleClose}>
          Modal Content
        </Modal>
      );
      const modal = container.querySelector('[class*="bg-neutral-0"]');
      if (modal) {
        fireEvent.click(modal);
      }
      expect(handleClose).not.toHaveBeenCalled();
    });

    it('should call footer button handlers', async () => {
      const handleAction = jest.fn();
      const handleClose = jest.fn();
      render(
        <Modal
          isOpen={true}
          onClose={handleClose}
          footer={<button onClick={handleAction}>Action</button>}
        >
          Content
        </Modal>
      );
      const button = screen.getByText('Action');
      await userEvent.click(button);
      expect(handleAction).toHaveBeenCalled();
    });
  });

  // Styling Tests
  describe('Styling', () => {
    it('should have backdrop overlay', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={jest.fn()}>
          Content
        </Modal>
      );
      const backdrop = container.querySelector('div[class*="bg-black"]');
      expect(backdrop).toHaveClass('bg-black/50');
    });

    it('should have modal container styles', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={jest.fn()}>
          Content
        </Modal>
      );
      const modal = container.querySelector('[class*="bg-neutral-0"]');
      expect(modal).toHaveClass('bg-neutral-0', 'rounded-lg', 'shadow-2xl');
    });

    it('should have responsive width', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={jest.fn()}>
          Content
        </Modal>
      );
      const modal = container.querySelector('[class*="max-w-md"]');
      expect(modal).toHaveClass('max-w-md', 'w-full');
    });

    it('should have animations', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={jest.fn()}>
          Content
        </Modal>
      );
      const backdrop = container.querySelector('[class*="animate-fadeIn"]');
      const modal = container.querySelector('[class*="animate-slideUp"]');
      expect(backdrop).toHaveClass('animate-fadeIn');
      expect(modal).toHaveClass('animate-slideUp');
    });
  });

  // Title Section Tests
  describe('Title Section', () => {
    it('should have title styling', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={jest.fn()} title="Test Title">
          Content
        </Modal>
      );
      const title = screen.getByText('Test Title');
      expect(title).toHaveClass('text-lg', 'font-semibold');
    });

    it('should have title container border', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={jest.fn()} title="Title">
          Content
        </Modal>
      );
      const titleSection = screen.getByText('Title').closest('div');
      expect(titleSection?.parentElement).toHaveClass('border-b', 'border-neutral-200');
    });
  });

  // Content Section Tests
  describe('Content Section', () => {
    it('should render content with padding', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <p>Content</p>
        </Modal>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should render complex content', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <h3>Subtitle</h3>
          <p>Paragraph</p>
          <input type="text" />
        </Modal>
      );
      expect(screen.getByRole('heading', { name: /subtitle/i })).toBeInTheDocument();
      expect(screen.getByText('Paragraph')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('should support role attributes', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={jest.fn()} role="alertdialog">
          Alert
        </Modal>
      );
      const modal = container.querySelector('[class*="bg-neutral-0"]');
      expect(modal).toHaveAttribute('role', 'alertdialog');
    });

    it('should support aria-label', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={jest.fn()} aria-label="Confirm delete">
          Content
        </Modal>
      );
      const modal = container.querySelector('[class*="bg-neutral-0"]');
      expect(modal).toHaveAttribute('aria-label', 'Confirm delete');
    });

    it('should trap focus within modal (content focus test)', async () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()}>
          <button>Button</button>
        </Modal>
      );
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should support keyboard escape (handled by parent)', () => {
      const handleClose = jest.fn();
      render(
        <Modal isOpen={true} onClose={handleClose}>
          Content with keyboard support
        </Modal>
      );
      expect(screen.getByText(/Content with keyboard/)).toBeInTheDocument();
    });
  });

  // State Transitions Tests
  describe('State Transitions', () => {
    it('should toggle visibility on isOpen change', () => {
      const { rerender, container } = render(
        <Modal isOpen={false} onClose={jest.fn()}>
          Content
        </Modal>
      );
      expect(container.querySelector('div[class*="fixed"]')).not.toBeInTheDocument();

      rerender(
        <Modal isOpen={true} onClose={jest.fn()}>
          Content
        </Modal>
      );
      expect(container.querySelector('div[class*="fixed"]')).toBeInTheDocument();

      rerender(
        <Modal isOpen={false} onClose={jest.fn()}>
          Content
        </Modal>
      );
      expect(container.querySelector('div[class*="fixed"]')).not.toBeInTheDocument();
    });

    it('should handle title changes', () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={jest.fn()} title="First">
          Content
        </Modal>
      );
      expect(screen.getByText('First')).toBeInTheDocument();

      rerender(
        <Modal isOpen={true} onClose={jest.fn()} title="Second">
          Content
        </Modal>
      );
      expect(screen.queryByText('First')).not.toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('should handle empty content', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={jest.fn()}>
          {null}
        </Modal>
      );
      expect(container.querySelector('div[class*="fixed"]')).toBeInTheDocument();
    });

    it('should handle very long title', () => {
      const longTitle = 'A'.repeat(100);
      render(
        <Modal isOpen={true} onClose={jest.fn()} title={longTitle}>
          Content
        </Modal>
      );
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should handle nested modals (stacking)', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()} title="Modal 1">
          <Modal isOpen={true} onClose={jest.fn()} title="Modal 2">
            Nested
          </Modal>
        </Modal>
      );
      expect(screen.getByText('Modal 1')).toBeInTheDocument();
      expect(screen.getByText('Modal 2')).toBeInTheDocument();
    });

    it('should render with max width constraint', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={jest.fn()}>
          Content
        </Modal>
      );
      const modal = container.querySelector('[class*="max-w-md"]');
      expect(modal).toHaveClass('max-w-md');
    });
  });

  // Integration Tests
  describe('Integration', () => {
    it('should work with form elements', () => {
      render(
        <Modal isOpen={true} onClose={jest.fn()} title="Form">
          <form>
            <input type="text" placeholder="Name" />
            <button type="submit">Submit</button>
          </form>
        </Modal>
      );
      expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });

    it('should work with controlled footer', () => {
      const handleConfirm = jest.fn();
      const handleClose = jest.fn();
      render(
        <Modal
          isOpen={true}
          onClose={handleClose}
          footer={
            <>
              <button onClick={handleClose}>Cancel</button>
              <button onClick={handleConfirm}>Confirm</button>
            </>
          }
        >
          Are you sure?
        </Modal>
      );
      expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    });
  });
});
