import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.js';
import pipelineReducer from './slices/pipelineSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    pipelines: pipelineReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export default store;
