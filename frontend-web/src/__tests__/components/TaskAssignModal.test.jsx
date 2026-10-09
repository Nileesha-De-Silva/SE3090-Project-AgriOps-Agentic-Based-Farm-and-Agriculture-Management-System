import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TaskAssignModal from '../../components/tasks/TaskAssignModal';
import { workerApi } from '../../services/workerApi';
import { assignWorkerToTask } from '../../store/slices/taskSlice';

const mockDispatch = vi.fn();
vi.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
}));

vi.mock('../../store/slices/taskSlice', () => ({
  assignWorkerToTask: vi.fn((payload) => ({ type: 'tasks/assignWorkerToTask', payload })),
}));

vi.mock('../../services/workerApi', () => ({
  workerApi: {
    getAllWorkers: vi.fn(),
    calculateMatchScore: vi.fn(),
  },
}));

describe('TaskAssignModal Component (Worker Assignment & Decision Logic)', () => {
  const mockTask = {
    id: 'task-dispatch-99',
    title: 'Automated Drip Fertigation Flush',
    taskType: 'Irrigation',
  };

  const mockWorkers = [
    {
      id: 'w-1',
      name: 'Sunil Perera',
      isAvailable: true,
      skills: ['IrrigationManagement', 'SoilTesting'],
      hourlyRate: 18,
      activeTasksCount: 0,
    },
    {
      id: 'w-2',
      name: 'Nimal Fernando',
      isAvailable: false,
      skills: ['CropScouting'],
      hourlyRate: 15,
      activeTasksCount: 3,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    workerApi.getAllWorkers.mockResolvedValue(mockWorkers);
    workerApi.calculateMatchScore.mockImplementation((worker) => (worker.id === 'w-1' ? 90 : 30));
  });

  it('renders modal and loads available workforce pool', async () => {
    render(<TaskAssignModal task={mockTask} onClose={() => {}} />);

    expect(screen.getByText('Assign Field Worker')).toBeInTheDocument();
    expect(screen.getByText(/Automated Drip Fertigation Flush/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Sunil Perera')).toBeInTheDocument();
      expect(screen.getByText('Nimal Fernando')).toBeInTheDocument();
    });

    expect(screen.getByText('90% Match')).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByText(/Busy \(3 active\)/i)).toBeInTheDocument();
  });

  it('keeps Confirm Assignment button disabled until a worker is selected', async () => {
    render(<TaskAssignModal task={mockTask} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Sunil Perera')).toBeInTheDocument();
    });

    const assignBtn = screen.getByRole('button', { name: /confirm assignment/i });
    expect(assignBtn).toBeDisabled();

    // Select Sunil Perera
    fireEvent.click(screen.getByText('Sunil Perera'));
    expect(assignBtn).not.toBeDisabled();
  });

  it('dispatches assignWorkerToTask and closes modal upon valid confirmation', async () => {
    const mockClose = vi.fn();
    render(<TaskAssignModal task={mockTask} onClose={mockClose} />);

    await waitFor(() => {
      expect(screen.getByText('Sunil Perera')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Sunil Perera'));
    const assignBtn = screen.getByRole('button', { name: /confirm assignment/i });
    fireEvent.click(assignBtn);

    expect(assignWorkerToTask).toHaveBeenCalledWith({
      taskId: 'task-dispatch-99',
      workerId: 'w-1',
      workerName: 'Sunil Perera',
    });
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'tasks/assignWorkerToTask',
      })
    );
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('does not select a worker who is busy/unavailable', async () => {
    render(<TaskAssignModal task={mockTask} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Nimal Fernando')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Nimal Fernando'));
    const assignBtn = screen.getByRole('button', { name: /confirm assignment/i });
    expect(assignBtn).toBeDisabled();
  });
});
