// src/store/slices/adminSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../../services/api";
import { toast } from "react-toastify";

// 1. MAKE SURE THIS HAS 'export' AT THE START
export const toggleUserStatus = createAsyncThunk(
  "admin/toggleUser",
  async (userId, { rejectWithValue }) => {
    try {
      // Note: Ensure this URL matches your Django path exactly
      const response = await api.post(`collabrix_admin/admin/users/${userId}/toggle/`);
      toast.success("User status updated successfully");
      return { userId, is_active: response.data.is_active };
    } catch (err) {
      toast.error("Failed to update user status");
      return rejectWithValue(err.response?.data);
    }
  }
);

export const fetchAdminPortalData = createAsyncThunk(
  "admin/fetchPortalData",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("collabrix_admin/admin/manage-all/");
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Error fetching data");
    }
  }
);

const adminSlice = createSlice({
  name: "admin",
  initialState: {
    stats: {},
    management: { users: [], workspaces: [], documents: [] },
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminPortalData.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload.stats;
        state.management = action.payload.management;
      })
      // 2. HANDLE THE UPDATE IN THE STATE
      .addCase(toggleUserStatus.fulfilled, (state, action) => {
        const user = state.management.users.find(u => u.id === action.payload.userId);
        if (user) {
          user.is_active = action.payload.is_active;
        }
      });
  },
});

export default adminSlice.reducer;