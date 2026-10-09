import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateTaskModal from '../../components/tasks/CreateTaskModal';
import * as farmApi from '../../services/farmApi';

// Mock react-redux
const mockDispatch = vi.fn();
vi.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
}));

// Mock farmApi
vi.mock('../../services/farmApi', () => ({
  getFields: vi.fn(),
}));

describe('CreateTaskModal Component (Form Validation)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    farmApi.getFields.mockResolvedValue([
      { id: 'field-1', name: 'North Paddy Field' },
      { id: 'field-2', name: 'South Orchard' },
    ]);
  });

  it('renders modal with required form inputs', async () => {
    render(<CreateTaskModal onClose={() => {}} />);

    expect(screen.getByText('Schedule Field Task')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e.g. Copper Hydroxide/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /schedule task/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(farmApi.getFields).toHaveBeenCalled();
    });
  });

  it('does not submit when title is empty', async () => {
    const mockClose = vi.fn();
    render(<CreateTaskModal onClose={mockClose} />);

    const submitBtn = screen.getByRole('button', { name: /schedule task/i });
    fireEvent.click(submitBtn);

    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockClose).not.toHaveBeenCalled();
  });

  it('dispatches addTask and closes modal when valid title is provided', async () => {
    const mockClose = vi.fn();
    render(<CreateTaskModal onClose={mockClose} />);

    const titleInput = screen.getByPlaceholderText(/e.g. Copper Hydroxide/i);
    fireEvent.change(titleInput, { target: { value: 'Water tomato beds' } });

    const submitBtn = screen.getByRole('button', { name: /schedule task/i });
    fireEvent.click(submitBtn);

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockClose).toHaveBeenCalledTimes(1);
  });
});
