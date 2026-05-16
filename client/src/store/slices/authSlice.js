import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

// --- Thunks ---
export const googleLogin = createAsyncThunk(
  'auth/googleLogin',
  async (code, { rejectWithValue }) => {
    try {
      const response = await api.post('/accounts/google_login/', { code }); 
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
      // Pass along structured backend details (e.g. { needs_verification: true, user: {...} })
      return rejectWithValue(err.response?.data || { detail: "Login failed" });
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

/**
 * Fetches the current user's profile.
 * Crucial for persistence after page refresh.
 */
export const fetchUserProfile = createAsyncThunk(
  'auth/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('accounts/user/profile/');
      console.log("PROFILE RESPONSE:", response.data);
      return response.data;
    } catch (err) {
      localStorage.removeItem('isAuthenticated');
      return rejectWithValue(err.response?.data || "Failed to load user profile");
    }
  }
);

/**
 * Updates user profile information (email and username only).
 */
export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await api.patch('accounts/user/profile/', profileData);
      return response.data; // Expected: { message: "...", needs_verification: true/false, user: { ... } }
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to update profile");
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
        state.user = action.payload; 
        state.isAuthenticated = true;
        state.loading = false;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        if (action.payload.needs_verification) {
          // Explicit logout scenario on changing email
          localStorage.removeItem('isAuthenticated');
          state.isAuthenticated = false;
          state.user = action.payload.user || null;
        } else {
          state.user = action.payload.user || action.payload;
        }
        state.loading = false;
      })
      .addCase(fetchMfaQr.fulfilled, (state, action) => {
        state.qrImage = action.payload; 
        state.loading = false;
      })
      .addCase(verifyMfa.fulfilled, (state, action) => {
        if (state.user) {
          state.user.mfa_enabled = action.payload.mfa_enabled || true;
        }
        state.qrImage = null;
        state.loading = false;
      })

      // Explicit Rejected Handlers
      .addCase(fetchUserProfile.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
      })
      .addCase(loginUser.rejected, (state, action) => {
        // --- FIXED CRITICAL ACTION: Catch unverified payload to block dead-ends ---
        const payload = action.payload;
        if (
          payload?.needs_verification || 
          (payload?.detail && (payload.detail.toLowerCase().includes("verify") || payload.detail.toLowerCase().includes("verification")))
        ) {
          // Stash the user details returned from backend so components have full validation access
          state.user = payload.user || { email: state.error?.email || null, is_email_verified: false };
          state.isAuthenticated = false;
        } else {
          state.user = null;
        }
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