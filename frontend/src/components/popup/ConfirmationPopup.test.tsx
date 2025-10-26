import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmationPopup from './ConfirmationPopup';

describe('ConfirmationPopup Component', () => {
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();
  const defaultProps = {
    isOpen: true,
    title: 'Test Title',
    message: 'Test Message',
    onConfirm: mockOnConfirm,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(<ConfirmationPopup {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
    expect(screen.queryByText('Test Message')).not.toBeInTheDocument();
  });

  it('should render the title and message when isOpen is true', () => {
    render(<ConfirmationPopup {...defaultProps} />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Message')).toBeInTheDocument();
  });

  it('should call onConfirm when the confirm button is clicked', () => {
    render(<ConfirmationPopup {...defaultProps} />);
    const confirmButton = screen.getByText('Delete');
    fireEvent.click(confirmButton);
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when the cancel button is clicked', () => {
    render(<ConfirmationPopup {...defaultProps} />);
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('should call onCancel when clicking outside the popup', () => {
    render(<ConfirmationPopup {...defaultProps} />);
    const overlay = screen.getByRole('presentation');
    fireEvent.click(overlay);
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });
});
