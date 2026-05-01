import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';


export const fetchWorkspaces = createAsyncThunk(
    'workspaces/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('workspaces/');
            return response.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || "Failed to fetch workspaces");
        }
    }
);

export const updateWorkspace = createAsyncThunk(
    'workspaces/update',
    async ({ id, formData }, { rejectWithValue }) => {
        try {
            const response = await api.put(`workspaces/${id}/`, formData);
            return response.data;
        } catch (err) {
            return rejectWithValue(err.response?.data || "Update failed");
        }
    }
);

export const deleteWorkspace = createAsyncThunk(
    'workspaces/delete',
    async (id, { rejectWithValue }) => {
        try {
            await api.delete(`workspaces/${id}/`);
            return id;
        } catch (err) {
            return rejectWithValue(err.response?.data || "Delete failed");
        }
    }
);

export const createWorkspace = createAsyncThunk(
    'workspaces/create',
    async (formData, { rejectWithValue }) => {
        try {
            const response = await api.post('workspaces/', formData);
            return response.data; 
        } catch (err) {
            return rejectWithValue(err.response?.data?.name || "Failed to create workspace");
        }
    }
);

const workspaceSlice = createSlice({
    name: 'workspaces',
    initialState: {
        list: [],
        loading: false,
        status: 'idle', 
        error: null,
        toast: null,
    },
    reducers: {
        resetStatus: (state) => {
            state.status = 'idle';
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchWorkspaces.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchWorkspaces.fulfilled, (state, action) => {
                state.loading = false;
                state.list = action.payload;
            })
            .addCase(fetchWorkspaces.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(createWorkspace.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(createWorkspace.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.list.push(action.payload);
            })
            .addCase(createWorkspace.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(updateWorkspace.fulfilled, (state, action) => {
                const index = state.list.findIndex(ws => ws.id === action.payload.id);
                if (index !== -1) state.list[index] = action.payload;
                state.toast = { type: 'success', text: 'Workspace updated successfully' };
            })
            .addCase(deleteWorkspace.fulfilled, (state, action) => {
                state.list = state.list.filter(ws => ws.id !== action.payload);
                state.toast = { type: 'success', text: 'Workspace deleted' };
            })
            .addCase(deleteWorkspace.rejected, (state, action) => {
                state.toast = { type: 'error', text: action.payload };
            });
    },
});

export const { clearToast } = workspaceSlice.actions;
export default workspaceSlice.reducer;