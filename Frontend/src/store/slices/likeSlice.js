import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import likeService from '../../services/like.service';

const initialState = {
  statusByPost: {},
  postLikes: { users: [], pagination: null },
  userLikes: { likes: [], pagination: null },
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
};

export const toggleLike = createAsyncThunk('likes/toggleLike', async (postId, thunkAPI) => {
  try {
    const res = await likeService.toggleLike(postId);
    return { postId, ...res.data };
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Failed to toggle like';
    return thunkAPI.rejectWithValue(msg);
  }
});

export const checkLikeStatus = createAsyncThunk('likes/checkLikeStatus', async (postId, thunkAPI) => {
  try {
    const res = await likeService.checkLikeStatus(postId);
    return { postId, ...res.data };
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Failed to check like status';
    return thunkAPI.rejectWithValue(msg);
  }
});

export const getPostLikes = createAsyncThunk('likes/getPostLikes', async ({ postId, page, limit }, thunkAPI) => {
  try {
    const res = await likeService.getPostLikes(postId, { page, limit });
    return res.data;
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Failed to fetch post likes';
    return thunkAPI.rejectWithValue(msg);
  }
});

export const getUserLikes = createAsyncThunk('likes/getUserLikes', async ({ page, limit }, thunkAPI) => {
  try {
    const res = await likeService.getUserLikes({ page, limit });
    return res.data;
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Failed to fetch user likes';
    return thunkAPI.rejectWithValue(msg);
  }
});

const likeSlice = createSlice({
  name: 'likes',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(toggleLike.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(toggleLike.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        const { postId, liked, likesCount } = action.payload;
        state.statusByPost[postId] = { isLiked: Boolean(liked), likesCount: Number(likesCount) };
      })
      .addCase(toggleLike.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(checkLikeStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkLikeStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        const { postId, isLiked, likesCount } = action.payload;
        state.statusByPost[postId] = { isLiked: Boolean(isLiked), likesCount: Number(likesCount) };
      })
      .addCase(checkLikeStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getPostLikes.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getPostLikes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.postLikes.users = action.payload.users || [];
        state.postLikes.pagination = action.payload.pagination || null;
      })
      .addCase(getPostLikes.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getUserLikes.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getUserLikes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userLikes.likes = action.payload.likes || [];
        state.userLikes.pagination = action.payload.pagination || null;
      })
      .addCase(getUserLikes.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset } = likeSlice.actions;
export default likeSlice.reducer;
