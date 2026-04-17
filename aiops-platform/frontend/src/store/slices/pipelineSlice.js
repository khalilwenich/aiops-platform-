import { createSlice } from '@reduxjs/toolkit';

const pipelineSlice = createSlice({
  name: 'pipelines',
  initialState: {
    selectedProjectId: null,
    statusFilter: null,
    currentPage: 1,
  },
  reducers: {
    setProjectFilter(state, action) {
      state.selectedProjectId = action.payload;
      state.currentPage = 1;
    },
    setStatusFilter(state, action) {
      state.statusFilter = action.payload;
      state.currentPage = 1;
    },
    setPage(state, action) {
      state.currentPage = action.payload;
    },
  },
});

export const { setProjectFilter, setStatusFilter, setPage } = pipelineSlice.actions;
export default pipelineSlice.reducer;
