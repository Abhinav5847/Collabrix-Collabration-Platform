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
            });
    },
});

export const { resetStatus } = workspaceSlice.actions;
export default workspaceSlice.reducer;