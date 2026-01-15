import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import commentService from '../../services/comment.service';

const initialState = {
  comments: [],
  pagination: null,
  currentComment: null,
  userComments: [],
  userPagination: null,
  commentCountByPost: {},
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
};

export const createComment = createAsyncThunk('comments/createComment', async ({ postId, content }, thunkAPI) => {
  try {
    const res = await commentService.createComment(postId, content);
    return res.data;
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Failed to create comment';
    return thunkAPI.rejectWithValue(msg);
  }
});

export const getPostComments = createAsyncThunk('comments/getPostComments', async ({ postId, page, limit }, thunkAPI) => {
  try {
    const res = await commentService.getPostComments(postId, { page, limit });
    return { postId, ...res.data };
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Failed to fetch comments';
    return thunkAPI.rejectWithValue(msg);
  }
});

export const getComment = createAsyncThunk('comments/getComment', async (commentId, thunkAPI) => {
  try {
    const res = await commentService.getComment(commentId);
    return res.data;
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Failed to fetch comment';
    return thunkAPI.rejectWithValue(msg);
  }
});

export const updateComment = createAsyncThunk('comments/updateComment', async ({ commentId, content }, thunkAPI) => {
  try {
    const res = await commentService.updateComment(commentId, content);
    return res.data;
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Failed to update comment';
    return thunkAPI.rejectWithValue(msg);
  }
});

export const deleteComment = createAsyncThunk('comments/deleteComment', async (commentId, thunkAPI) => {
  try {
    await commentService.deleteComment(commentId);
    return { commentId };
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Failed to delete comment';
    return thunkAPI.rejectWithValue(msg);
  }
});

export const toggleVisibility = createAsyncThunk('comments/toggleVisibility', async (commentId, thunkAPI) => {
  try {
    const res = await commentService.toggleVisibility(commentId);
    return res.data;
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Failed to toggle visibility';
    return thunkAPI.rejectWithValue(msg);
  }
});

export const getUserComments = createAsyncThunk('comments/getUserComments', async ({ page, limit }, thunkAPI) => {
  try {
    const res = await commentService.getUserComments({ page, limit });
    return res.data;
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Failed to fetch user comments';
    return thunkAPI.rejectWithValue(msg);
  }
});

export const getCommentCount = createAsyncThunk('comments/getCommentCount', async (postId, thunkAPI) => {
  try {
    const res = await commentService.getCommentCount(postId);
    return { postId, ...res.data };
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Failed to fetch comment count';
    return thunkAPI.rejectWithValue(msg);
  }
});

const commentSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
    clearCurrentComment: (state) => {
      state.currentComment = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createComment.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createComment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.comments = [action.payload, ...state.comments];
      })
      .addCase(createComment.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getPostComments.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getPostComments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.comments = action.payload.comments || [];
        state.pagination = action.payload.pagination || null;
      })
      .addCase(getPostComments.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getComment.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getComment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentComment = action.payload || null;
      })
      .addCase(getComment.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(updateComment.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateComment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.currentComment = action.payload;
        const idx = state.comments.findIndex((c) => c._id === action.payload._id);
        if (idx !== -1) state.comments[idx] = action.payload;
      })
      .addCase(updateComment.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(deleteComment.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        const id = action.payload.commentId;
        state.comments = state.comments.filter((c) => c._id !== id);
        if (state.currentComment?._id === id) state.currentComment = null;
      })
      .addCase(deleteComment.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(toggleVisibility.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(toggleVisibility.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        const updated = action.payload;
        const idx = state.comments.findIndex((c) => c._id === updated._id);
        if (idx !== -1) state.comments[idx] = updated;
        if (state.currentComment?._id === updated._id) state.currentComment = updated;
      })
      .addCase(toggleVisibility.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getUserComments.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getUserComments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userComments = action.payload.comments || [];
        state.userPagination = action.payload.pagination || null;
      })
      .addCase(getUserComments.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getCommentCount.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCommentCount.fulfilled, (state, action) => {
        state.isLoading = false;
        const { postId, commentCount } = action.payload;
        state.commentCountByPost[postId] = commentCount;
      })
      .addCase(getCommentCount.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset, clearCurrentComment } = commentSlice.actions;
export default commentSlice.reducer;
