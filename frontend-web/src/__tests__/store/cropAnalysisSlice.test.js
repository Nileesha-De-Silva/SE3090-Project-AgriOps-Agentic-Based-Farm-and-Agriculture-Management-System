import { describe, it, expect } from 'vitest';
import cropAnalysisReducer, {
  clearActiveResult,
} from '../../store/slices/cropAnalysisSlice';

describe('cropAnalysisSlice Redux Reducer', () => {
  const initialState = {
    pendingApprovals: [
      { id: 'appr-1', crop: 'Tomato', symptom: 'Blight' },
      { id: 'appr-2', crop: 'Paddy', symptom: 'Blast' },
    ],
    status: 'idle',
    error: null,
    activeAnalysisResult: { diagnosis: 'Early Blight', confidence: 0.95 },
    isAnalyzing: false,
  };

  it('should return default initial state', () => {
    const state = cropAnalysisReducer(undefined, { type: 'unknown' });
    expect(state.pendingApprovals).toEqual([]);
    expect(state.status).toBe('idle');
    expect(state.isAnalyzing).toBe(false);
  });

  it('should clear active analysis result', () => {
    const actual = cropAnalysisReducer(initialState, clearActiveResult());
    expect(actual.activeAnalysisResult).toBeNull();
  });
});
