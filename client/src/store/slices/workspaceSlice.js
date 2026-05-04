import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

// --- Existing Thunks ---
export const fetchWorkspaces = createAsyncThunk('workspaces/fetchAll', async (_, { rejectWithValue }) => {
    try { const response = await api.get('workspaces/'); return response.data; } 
    catch (err) { return rejectWithValue(err.response?.data || "Failed to fetch"); }
});

export const updateWorkspace = createAsyncThunk('workspaces/update', async ({ id, formData }, { rejectWithValue }) => {
    try { const response = await api.put(`workspaces/${id}/`, formData); return response.data; } 
    catch (err) { return rejectWithValue(err.response?.data || "Update failed"); }
});

export const deleteWorkspace = createAsyncThunk('workspaces/delete', async (id, { rejectWithValue }) => {
    try { await api.delete(`workspaces/${id}/`); return id; } 
    catch (err) { return rejectWithValue(err.response?.data || "Delete failed"); }
});

export const createWorkspace = createAsyncThunk('workspaces/create', async (formData, { rejectWithValue }) => {
    try { const response = await api.post('workspaces/', formData); return response.data; } 
    catch (err) { return rejectWithValue(err.response?.data?.name || "Failed to create"); }
});

// --- New Thunks for Members & Users ---
export const fetchAllUsers = createAsyncThunk('accounts/fetchAllUsers', async (_, { rejectWithValue }) => {
    try { const response = await api.get('accounts/users/'); return response.data; } 
    catch (err) { return rejectWithValue(err.response?.data || "Failed to fetch users"); }
});

export const fetchWorkspaceMembers = createAsyncThunk('workspaces/fetchMembers', async (workspaceId, { rejectWithValue }) => {
    try { const response = await api.get(`workspaces/workspace/${workspaceId}/members/`); return response.data.results || response.data; } 
    catch (err) { return rejectWithValue(err.response?.data || "Failed to fetch members"); }
});

const workspaceSlice = createSlice({
    name: 'workspaces',
    initialState: {
        list: [],
        members: [],
        allUsers: [], // For the invitation list
        loading: false,
        status: 'idle', 
        error: null,
        toast: null,
    },
    reducers: {
        resetStatus: (state) => { state.status = 'idle'; state.error = null; },
        clearToast: (state) => { state.toast = null; }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchWorkspaces.fulfilled, (state, action) => { state.list = action.payload; state.loading = false; })
            .addCase(fetchAllUsers.fulfilled, (state, action) => { state.allUsers = action.payload; })
            .addCase(fetchWorkspaceMembers.fulfilled, (state, action) => { state.members = action.payload; state.loading = false; })
            .addCase(createWorkspace.fulfilled, (state, action) => { state.list.push(action.payload); state.status = 'succeeded'; })
            .addCase(updateWorkspace.fulfilled, (state, action) => {
                const index = state.list.findIndex(ws => ws.id === action.payload.id);
                if (index !== -1) state.list[index] = action.payload;
                state.toast = { type: 'success', text: 'Workspace updated' };
            })
            .addCase(deleteWorkspace.fulfilled, (state, action) => {
                state.list = state.list.filter(ws => ws.id !== action.payload);
                state.toast = { type: 'success', text: 'Workspace deleted' };
            });
    },
});

export const { resetStatus, clearToast } = workspaceSlice.actions;
export default workspaceSlice.reducer;