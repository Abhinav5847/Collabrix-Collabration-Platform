// src/store/slices/workspaceSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

export const fetchWorkspaces = createAsyncThunk(
  'workspaces/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('workspaces/');
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to load");
    }
  }
);

const workspaceSlice = createSlice({
  name: 'workspaces',
  initialState: {
    list: [],
    loading: false,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkspaces.pending, (state) => { state.loading = true; })
      .addCase(fetchWorkspaces.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchWorkspaces.rejected, (state) => { state.loading = false; });
  },
});

// CRITICAL: This is the line you are likely missing!
export default workspaceSlice.reducer;