import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../../services/api";
import { toast } from "react-toastify";

// --- EXISTING USER THUNKS ---

export const toggleUserStatus = createAsyncThunk(
  "admin/toggleUser",
  async (userId, { rejectWithValue }) => {
    try {
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

// --- NEW WORKSPACE THUNKS ---

export const adminUpdateWorkspace = createAsyncThunk(
  "admin/updateWorkspace",
  async ({ id, name }, { rejectWithValue }) => {
    try {
      // Adjusted path to match your collabrix_admin prefix
      const response = await api.put(`collabrix_admin/admin/workspaces/${id}/`, { name });
      toast.success("Workspace updated successfully");
      return response.data;
    } catch (err) {
      toast.error("Update failed");
      return rejectWithValue(err.response?.data);
    }
  }
);

export const adminDeleteWorkspace = createAsyncThunk(
  "admin/deleteWorkspace",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`collabrix_admin/admin/workspaces/${id}/`);
      toast.success("Workspace archived");
      return { id, message: response.data.message };
    } catch (err) {
      toast.error("Delete failed");
      return rejectWithValue(err.response?.data);
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
  reducers: {
    // Added a clear action in case you need to reset errors/toasts
    clearAdminState: (state) => {
      state.loading = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Existing Handlers
      .addCase(fetchAdminPortalData.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAdminPortalData.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload.stats;
        state.management = action.payload.management;
      })
      .addCase(fetchAdminPortalData.rejected, (state) => {
        state.loading = false;
      })
      .addCase(toggleUserStatus.fulfilled, (state, action) => {
        const user = state.management.users.find(u => u.id === action.payload.userId);
        if (user) {
          user.is_active = action.payload.is_active;
        }
      })
      
      // New Workspace Handlers
      .addCase(adminUpdateWorkspace.fulfilled, (state, action) => {
        const index = state.management.workspaces.findIndex(ws => ws.id === action.payload.id);
        if (index !== -1) {
          state.management.workspaces[index].name = action.payload.name;
        }
      })
      .addCase(adminDeleteWorkspace.fulfilled, (state, action) => {
        const index = state.management.workspaces.findIndex(ws => ws.id === action.payload.id);
        if (index !== -1) {
          // Marking as inactive to reflect soft-delete in UI
          state.management.workspaces[index].is_active = false;
        }
      });
  },
});

export const { clearAdminState } = adminSlice.actions;
export default adminSlice.reducer;