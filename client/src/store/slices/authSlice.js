import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../../services/api';

export const loginUser = createAsyncThunk(
  'auth/login',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/accounts/login/', userData);
      localStorage.setItem('access', response.data.access);
      localStorage.setItem('refresh', response.data.refresh);
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

export const resendOtp = createAsyncThunk(
  'auth/resendOtp',
  async (email, { rejectWithValue }) => {
    try {
      const response = await api.post("/accounts/resend_otp/", { email });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to resend OTP");
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
      return rejectWithValue(err.response?.data || "Verification failed");
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem('access'),
    loading: false,
    error: null,
    qrImage: null, 
  },
  reducers: {
    logout: (state) => {
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      state.user = null;
      state.token = null;
      state.error = null;
      state.qrImage = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login Handlers
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.access;
        state.user = action.payload.user;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Register Handlers
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
        
    //   otp verify
      .addCase(verifyOtp.pending, (state) => { state.loading = true; })
      .addCase(verifyOtp.fulfilled, (state) => { state.loading = false; })
      .addCase(verifyOtp.rejected, (state, action) => { 
      state.loading = false; 
      state.error = action.payload; 
      })
      .addCase(resendOtp.pending, (state) => { state.loading = true; })
      .addCase(resendOtp.fulfilled, (state) => { state.loading = false; })
      .addCase(resendOtp.rejected, (state) => { state.loading = false; })

      // Forgot Password Handlers
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Reset Password Handlers
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // MFA QR Handlers
      .addCase(fetchMfaQr.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMfaQr.fulfilled, (state, action) => {
        state.loading = false;
        state.qrImage = action.payload;
      })
      .addCase(fetchMfaQr.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(verifyMfa.pending, (state) => {
       state.loading = true;
       state.error = null;
       })
       .addCase(verifyMfa.fulfilled, (state) => {
         state.loading = false;
    // You could set state.user.mfa_enabled = true here if needed
         })
       .addCase(verifyMfa.rejected, (state, action) => {
       state.loading = false;
       state.error = action.payload;
       });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;