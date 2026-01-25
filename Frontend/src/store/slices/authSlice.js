import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/auth.service';

const user = JSON.parse(localStorage.getItem('user'));

const initialState = {
  user: user || null,
  isAuthenticated: !!user,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
};

/**
 * Initiate Azure AD OAuth2 login
 */
export const initiateLogin = createAsyncThunk(
  'auth/initiateLogin',
  async (_, thunkAPI) => {
    try {
      const response = await authService.initiateLogin();
      return response;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to initiate login';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

/**
 * Handle OAuth callback after redirect from Azure AD
 */
export const handleOAuthCallback = createAsyncThunk(
  'auth/handleOAuthCallback',
  async (_, thunkAPI) => {
    try {
      const response = await authService.handleOAuthCallback();
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Authentication failed';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

/**
 * Get current user details
 */
export const getUser = createAsyncThunk(
  'auth/getUser',
  async (_, thunkAPI) => {
    try {
      const response = await authService.getUser();
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch user';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

/**
 * Logout user
 */
export const logout = createAsyncThunk('auth/logout', async (_, thunkAPI) => {
  try {
    await authService.logout();
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Logout failed';
    return thunkAPI.rejectWithValue(message);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Initiate Login
      .addCase(initiateLogin.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = '';
      })
      .addCase(initiateLogin.fulfilled, (state) => {
        state.isLoading = false;
        // Redirect happens in the service, no state change needed
      })
      .addCase(initiateLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Handle OAuth Callback
      .addCase(handleOAuthCallback.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = '';
      })
      .addCase(handleOAuthCallback.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(handleOAuthCallback.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.user = null;
        state.isAuthenticated = false;
      })
      // Get User
      .addCase(getUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(getUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.user = null;
        state.isAuthenticated = false;
      })
      // Logout
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.isSuccess = false;
      })
      .addCase(logout.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset, setUser } = authSlice.actions;
export default authSlice.reducer;

