import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { cropAnalysisApi } from '../../services/cropAnalysisApi';
import { fetchTasks } from './taskSlice';

export const fetchPendingApprovals = createAsyncThunk(
  'cropAnalysis/fetchPendingApprovals',
  async () => {
    return await cropAnalysisApi.getPendingApprovals();
  }
);

export const approveAlert = createAsyncThunk(
  'cropAnalysis/approveAlert',
  async ({ analysisId, threadId, comments }, { dispatch }) => {
    const res = await cropAnalysisApi.approveAnalysis(analysisId, threadId, comments);
    // Refresh tasks on Kanban because a new task was auto-dispatched
    dispatch(fetchTasks());
    return res;
  }
);

export const rejectAlert = createAsyncThunk(
  'cropAnalysis/rejectAlert',
  async ({ analysisId, threadId, reason }) => {
    return await cropAnalysisApi.rejectAnalysis(analysisId, threadId, reason);
  }
);

export const runAgentAnalysis = createAsyncThunk(
  'cropAnalysis/runAgentAnalysis',
  async (observationData, { dispatch }) => {
    const res = await cropAnalysisApi.analyzeCropObservation(observationData);
    // Refresh approvals in case an alert was paused at human_gate
    dispatch(fetchPendingApprovals());
    return res;
  }
);

const initialState = {
  pendingApprovals: [],
  status: 'idle',
  error: null,
  activeAnalysisResult: null,
  isAnalyzing: false,
};

export const cropAnalysisSlice = createSlice({
  name: 'cropAnalysis',
  initialState,
  reducers: {
    clearActiveResult: (state) => {
      state.activeAnalysisResult = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPendingApprovals.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchPendingApprovals.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.pendingApprovals = action.payload;
      })
      .addCase(fetchPendingApprovals.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(approveAlert.fulfilled, (state, action) => {
        state.pendingApprovals = state.pendingApprovals.filter(
          (a) => a.id !== action.payload.analysisId
        );
      })
      .addCase(rejectAlert.fulfilled, (state, action) => {
        state.pendingApprovals = state.pendingApprovals.filter(
          (a) => a.id !== action.payload.analysisId
        );
      })
      .addCase(runAgentAnalysis.pending, (state) => {
        state.isAnalyzing = true;
        state.activeAnalysisResult = null;
      })
      .addCase(runAgentAnalysis.fulfilled, (state, action) => {
        state.isAnalyzing = false;
        state.activeAnalysisResult = action.payload;
      })
      .addCase(runAgentAnalysis.rejected, (state, action) => {
        state.isAnalyzing = false;
        state.error = action.error.message;
      });
  },
});

export const { clearActiveResult } = cropAnalysisSlice.actions;

export default cropAnalysisSlice.reducer;
