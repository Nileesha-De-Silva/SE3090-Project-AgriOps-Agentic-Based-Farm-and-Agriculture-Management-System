import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TaskKanbanBoard from '../../components/tasks/TaskKanbanBoard';
import { fetchTasks } from '../../store/slices/taskSlice';

const mockDispatch = vi.fn();
let mockState = {
  tasks: {
    items: [],
    status: 'idle',
    filters: {
      priority: 'all',
      fieldId: 'all',
      searchQuery: '',
    },
  },
};

vi.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector) => selector(mockState),
}));

vi.mock('../../store/slices/taskSlice', () => ({
  fetchTasks: vi.fn(() => ({ type: 'tasks/fetchTasks' })),
  updateTaskStatus: vi.fn(),
  setPriorityFilter: vi.fn(),
  setFieldFilter: vi.fn(),
  setSearchQuery: vi.fn(),
}));

// Mock child modals and icons to focus on Kanban container testing
vi.mock('../../components/tasks/CreateTaskModal', () => ({
  default: ({ onClose }) => (
    <div data-testid="create-task-modal">
      <span>Mock Create Task Modal</span>
      <button onClick={onClose}>Close Mock</button>
    </div>
  ),
}));

vi.mock('../../components/tasks/TaskAssignModal', () => ({
  default: () => <div>Mock Assign Modal</div>,
}));

vi.mock('../../components/tasks/EvidenceVerificationModal', () => ({
  default: () => <div>Mock Verification Modal</div>,
}));

describe('TaskKanbanBoard Component (Kanban Columns & State Filtering)', () => {
  const sampleTasks = [
    {
      id: 'task-1',
      title: 'Inspect North Sensors',
      status: 'Pending',
      priority: 'High',
      fieldId: 'field-1',
      taskType: 'CropMonitoring',
    },
    {
      id: 'task-2',
      title: 'Apply Organic Fertilizer',
      status: 'Assigned',
      priority: 'Medium',
      fieldId: 'field-2',
      taskType: 'Fertilization',
      assignedWorkerName: 'Kamal Silva',
    },
    {
      id: 'task-3',
      title: 'Pruning Vineyard Row 5',
      status: 'InProgress',
      priority: 'Low',
      fieldId: 'field-1',
      taskType: 'Pruning',
    },
    {
      id: 'task-4',
      title: 'Bio-Fungicide Verification',
      status: 'PendingVerification',
      priority: 'High',
      fieldId: 'field-3',
      taskType: 'PesticideApplication',
      evidence: { photoUrl: 'https://img.local/proof.jpg' },
    },
    {
      id: 'task-5',
      title: 'Harvest Sweet Corn',
      status: 'Completed',
      priority: 'Medium',
      fieldId: 'field-4',
      taskType: 'Harvesting',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all 5 operational lifecycle columns of the Kanban board', () => {
    mockState = {
      tasks: {
        items: sampleTasks,
        status: 'idle',
        filters: { priority: 'all', fieldId: 'all', searchQuery: '' },
      },
    };

    render(<TaskKanbanBoard />);

    expect(screen.getAllByText('Pending').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Assigned').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('In Progress').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Verification Gate').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Completed').length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText('Inspect North Sensors')).toBeInTheDocument();
    expect(screen.getByText('Apply Organic Fertilizer')).toBeInTheDocument();
    expect(screen.getByText('Pruning Vineyard Row 5')).toBeInTheDocument();
    expect(screen.getByText('Bio-Fungicide Verification')).toBeInTheDocument();
    expect(screen.getByText('Harvest Sweet Corn')).toBeInTheDocument();
  });

  it('filters tasks dynamically when priority filter is applied', () => {
    mockState = {
      tasks: {
        items: sampleTasks,
        status: 'idle',
        filters: { priority: 'high', fieldId: 'all', searchQuery: '' },
      },
    };

    render(<TaskKanbanBoard />);

    expect(screen.getByText('Inspect North Sensors')).toBeInTheDocument();
    expect(screen.getByText('Bio-Fungicide Verification')).toBeInTheDocument();

    // Medium & Low tasks should be excluded from view
    expect(screen.queryByText('Apply Organic Fertilizer')).not.toBeInTheDocument();
    expect(screen.queryByText('Pruning Vineyard Row 5')).not.toBeInTheDocument();
  });

  it('filters tasks by search query matching task title or worker name', () => {
    mockState = {
      tasks: {
        items: sampleTasks,
        status: 'idle',
        filters: { priority: 'all', fieldId: 'all', searchQuery: 'Fertilizer' },
      },
    };

    render(<TaskKanbanBoard />);

    expect(screen.getByText('Apply Organic Fertilizer')).toBeInTheDocument();
    expect(screen.queryByText('Inspect North Sensors')).not.toBeInTheDocument();
    expect(screen.queryByText('Harvest Sweet Corn')).not.toBeInTheDocument();
  });

  it('opens CreateTaskModal when Create Task button is clicked', () => {
    mockState = {
      tasks: {
        items: [],
        status: 'idle',
        filters: { priority: 'all', fieldId: 'all', searchQuery: '' },
      },
    };

    render(<TaskKanbanBoard />);

    expect(screen.queryByTestId('create-task-modal')).not.toBeInTheDocument();

    const createBtn = screen.getByRole('button', { name: /create task/i });
    fireEvent.click(createBtn);

    expect(screen.getByTestId('create-task-modal')).toBeInTheDocument();
  });

  it('dispatches fetchTasks when Refresh button is clicked', () => {
    mockState = {
      tasks: {
        items: [],
        status: 'idle',
        filters: { priority: 'all', fieldId: 'all', searchQuery: '' },
      },
    };

    render(<TaskKanbanBoard />);

    const refreshBtn = screen.getByTitle('Refresh Tasks');
    fireEvent.click(refreshBtn);

    expect(fetchTasks).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'tasks/fetchTasks',
      })
    );
  });
});
