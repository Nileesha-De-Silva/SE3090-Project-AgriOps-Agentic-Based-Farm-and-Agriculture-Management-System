import { describe, it, expect } from 'vitest';
import taskReducer, {
  setPriorityFilter,
  setFieldFilter,
  setSearchQuery,
  optimisticStatusChange,
} from '../../store/slices/taskSlice';

describe('taskSlice Redux Reducer', () => {
  const initialState = {
    items: [
      { id: 'task-1', title: 'Inspect Irrigation', status: 'In Progress', priority: 'High' },
      { id: 'task-2', title: 'Apply Fertilizer', status: 'Pending Verification', priority: 'Medium' },
    ],
    status: 'idle',
    error: null,
    filters: {
      priority: 'all',
      fieldId: 'all',
      searchQuery: '',
    },
  };

  it('should return initial state when passed an empty action', () => {
    const state = taskReducer(undefined, { type: 'unknown' });
    expect(state.items).toEqual([]);
    expect(state.status).toBe('idle');
    expect(state.filters.priority).toBe('all');
  });

  it('should update priority filter', () => {
    const actual = taskReducer(initialState, setPriorityFilter('High'));
    expect(actual.filters.priority).toBe('High');
  });

  it('should update field filter', () => {
    const actual = taskReducer(initialState, setFieldFilter('field-101'));
    expect(actual.filters.fieldId).toBe('field-101');
  });

  it('should update search query', () => {
    const actual = taskReducer(initialState, setSearchQuery('Irrigation'));
    expect(actual.filters.searchQuery).toBe('Irrigation');
  });

  it('should optimistically update task status', () => {
    const actual = taskReducer(
      initialState,
      optimisticStatusChange({ taskId: 'task-1', newStatus: 'Completed' })
    );
    const updatedTask = actual.items.find((t) => t.id === 'task-1');
    expect(updatedTask.status).toBe('Completed');
  });
});
