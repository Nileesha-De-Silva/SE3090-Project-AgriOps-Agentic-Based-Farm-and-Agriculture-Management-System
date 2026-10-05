import { configureStore } from '@reduxjs/toolkit';
import taskReducer from './slices/taskSlice';
import cropAnalysisReducer from './slices/cropAnalysisSlice';

export const store = configureStore({
  reducer: {
    tasks: taskReducer,
    cropAnalysis: cropAnalysisReducer,
  },
});

export default store;
