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

const workspaceSlice = createSlice({
    name: 'workspaces',
    initialState: {
        list: [],
        loading: false,
        error: null,
    },
    reducers: {},
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
            });
    },
});

export default workspaceSlice.reducer;