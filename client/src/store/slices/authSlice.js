import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

// --- Thunks ---

export const googleLogin = createAsyncThunk(
  'auth/googleLogin',
  async (code, { rejectWithValue }) => {
    try {
      const response = await api.get(`/accounts/google/callback/?code=${code}`);
      localStorage.setItem('isAuthenticated', 'true');
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Google login failed");
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/accounts/login/', userData);
      localStorage.setItem('isAuthenticated', 'true');
      return response.data; 
    } catch (err) {
      return rejectWithValue(err.response?.data || "Login failed");
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/accounts/register/', userData);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Registration failed");
    }
  }
);

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const response = await api.post("/accounts/verify_otp/", { email, otp });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Verification failed");
    }
  }
);

export const fetchUserProfile = createAsyncThunk(
  'auth/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('accounts/user/profile/');
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to load user profile");
    }
  }
);

export const fetchMfaQr = createAsyncThunk(
  'auth/fetchMfaQr',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/accounts/enable_mfa/", {
        responseType: "blob", 
      });
      return URL.createObjectURL(response.data);
    } catch (err) {
      return rejectWithValue("Failed to load QR code");
    }
  }
);

export const verifyMfa = createAsyncThunk(
  'auth/verifyMfa',
  async (code, { rejectWithValue }) => {
    try {
      const response = await api.post("/accounts/verify_mfa/", { code });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "MFA Verification failed");
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email, { rejectWithValue }) => {
    try {
      const response = await api.post('/accounts/forgot_pass/', { email });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Something went wrong");
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ uid, token, password }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/accounts/reset_pass/${uid}/${token}/`, { password });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Invalid or expired link");
    }
  }
);

// --- Slice ---

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null, 
    isAuthenticated: localStorage.getItem('isAuthenticated') === 'true',
    loading: false,
    error: null,
    qrImage: null,
  },
  reducers: {
    logout: (state) => {
      localStorage.removeItem('isAuthenticated'); 
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.qrImage = null;
      api.post('/accounts/logout/').catch(() => {});
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user || action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user || action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(fetchMfaQr.fulfilled, (state, action) => {
        state.loading = false;
        state.qrImage = action.payload; 
      })
      .addCase(verifyMfa.fulfilled, (state) => {
        state.loading = false;
        state.qrImage = null;
      })
      .addMatcher(
        (action) => action.type.endsWith('/pending'),
        (state) => { state.loading = true; state.error = null; }
      )
      .addMatcher(
        (action) => action.type.endsWith('/rejected'),
        (state, action) => {
          state.loading = false;
          state.error = action.payload;
        }
      );
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;