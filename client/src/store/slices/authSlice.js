import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

// --- Thunks ---

/**
 * Handles Google OAuth callback logic.
 */
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

/**
 * Handles standard email/password login.
 */
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

/**
 * Registers a new user.
 */
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

/**
 * Verifies Email OTP.
 */
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

/**
 * Fetches the current user's profile.
 * Crucial for persistence after page refresh.
 */
export const fetchUserProfile = createAsyncThunk(
  'auth/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('accounts/user/profile/');
      return response.data; // Expecting { ..., mfa_enabled: boolean }
    } catch (err) {
      localStorage.removeItem('isAuthenticated');
      return rejectWithValue(err.response?.data || "Failed to load user profile");
    }
  }
);

/**
 * Fetches the QR code for MFA setup.
 */
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

/**
 * Verifies the 6-digit TOTP code to enable MFA.
 */
export const verifyMfa = createAsyncThunk(
  'auth/verifyMfa',
  async (code, { rejectWithValue }) => {
    try {
      const response = await api.post("/accounts/verify_mfa/", { code });
      return response.data; // Expected { message: "...", mfa_enabled: true }
    } catch (err) {
      return rejectWithValue(err.response?.data || "MFA Verification failed");
    }
  }
);

/**
 * Request password reset email.
 */
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

/**
 * Resets password using UID and Token.
 */
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
    // Start loading as true if we have a session to check
    loading: localStorage.getItem('isAuthenticated') === 'true',
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
      // Fulfilled Handlers
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.user = action.payload.user || action.payload;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload.user || action.payload;
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.user = action.payload; // Contains updated mfa_enabled status
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(fetchMfaQr.fulfilled, (state, action) => {
        state.qrImage = action.payload; 
        state.loading = false;
      })
      .addCase(verifyMfa.fulfilled, (state, action) => {
        // Manually update the user status to avoid a second profile fetch
        if (state.user) {
          state.user.mfa_enabled = action.payload.mfa_enabled || true;
        }
        state.qrImage = null;
        state.loading = false;
      })

      // Rejected Handlers
      .addCase(fetchUserProfile.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
      })

      // Global Matchers for status management
      .addMatcher(
        (action) => action.type.startsWith('auth/') && action.type.endsWith('/pending'),
        (state) => { 
          state.loading = true; 
          state.error = null; 
        }
      )
      .addMatcher(
        (action) => action.type.startsWith('auth/') && action.type.endsWith('/rejected'),
        (state, action) => {
          state.loading = false;
          state.error = action.payload;
        }
      )
      .addMatcher(
        (action) => action.type.startsWith('auth/') && action.type.endsWith('/fulfilled'),
        (state) => {
          state.loading = false;
        }
      );
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;