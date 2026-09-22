import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { taskApi } from '../../services/taskApi';

export const fetchTasks = createAsyncThunk('tasks/fetchTasks', async () => {
  return await taskApi.getAllTasks();
});

export const addTask = createAsyncThunk('tasks/addTask', async (taskData) => {
  return await taskApi.createTask(taskData);
});

export const assignWorkerToTask = createAsyncThunk(
  'tasks/assignWorker',
  async ({ taskId, workerId, workerName }) => {
    return await taskApi.assignWorker(taskId, workerId, workerName);
  }
);

export const updateTaskStatus = createAsyncThunk(
  'tasks/updateStatus',
  async ({ taskId, newStatus }) => {
    return await taskApi.updateStatus(taskId, newStatus);
  }
);

export const verifyTaskEvidence = createAsyncThunk(
  'tasks/verifyTaskEvidence',
  async ({ taskId, isApproved, feedback }) => {
    return await taskApi.verifyTask(taskId, isApproved, feedback);
  }
);

const initialState = {
  items: [],
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  filters: {
    priority: 'all',
    fieldId: 'all',
    searchQuery: '',
  },
};

export const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setPriorityFilter: (state, action) => {
      state.filters.priority = action.payload;
    },
    setFieldFilter: (state, action) => {
      state.filters.fieldId = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.filters.searchQuery = action.payload;
    },
    // Optimistic status update when dragging or clicking
    optimisticStatusChange: (state, action) => {
      const { taskId, newStatus } = action.payload;
      const task = state.items.find((t) => t.id === taskId);
      if (task) {
        task.status = newStatus;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(addTask.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(assignWorkerToTask.fulfilled, (state, action) => {
        const idx = state.items.findIndex((t) => t.id === action.payload.id);
        if (idx !== -1) {
          state.items[idx] = action.payload;
        }
      })
      .addCase(updateTaskStatus.fulfilled, (state, action) => {
        const idx = state.items.findIndex((t) => t.id === action.payload.id);
        if (idx !== -1) {
          state.items[idx] = action.payload;
        }
      })
      .addCase(verifyTaskEvidence.fulfilled, (state, action) => {
        const idx = state.items.findIndex((t) => t.id === action.payload.id);
        if (idx !== -1) {
          state.items[idx] = action.payload;
        }
      });
  },
});

export const {
  setPriorityFilter,
  setFieldFilter,
  setSearchQuery,
  optimisticStatusChange,
} = taskSlice.actions;

export default taskSlice.reducer;
