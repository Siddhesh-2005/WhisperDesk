import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import postService from '../../services/post.service';

const initialState = {
  posts: [],
  pagination: null,
  currentPost: null,
  userPosts: [],
  userPagination: null,
  categoryPosts: [],
  categoryPagination: null,
  lastCreatedPostId: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
};

export const createPost = createAsyncThunk(
  'posts/createPost',
  async (payload, thunkAPI) => {
    try {
      const res = await postService.createPost(payload);
      return res.data; // { postId }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to create post';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const getPosts = createAsyncThunk(
  'posts/getPosts',
  async (params, thunkAPI) => {
    try {
      const res = await postService.getPosts(params);
      return res.data; // { posts, pagination }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch posts';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const getPost = createAsyncThunk(
  'posts/getPost',
  async (postId, thunkAPI) => {
    try {
      const res = await postService.getPost(postId);
      return res.data; // post
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch post';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const updatePost = createAsyncThunk(
  'posts/updatePost',
  async ({ postId, data }, thunkAPI) => {
    try {
      const res = await postService.updatePost(postId, data);
      return res.data; // updated post
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to update post';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const deletePost = createAsyncThunk(
  'posts/deletePost',
  async (postId, thunkAPI) => {
    try {
      const res = await postService.deletePost(postId);
      return { postId, data: res.data };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to delete post';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const getUserPosts = createAsyncThunk(
  'posts/getUserPosts',
  async (params, thunkAPI) => {
    try {
      const res = await postService.getUserPosts(params);
      return res.data; // { posts, pagination }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch user posts';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const getPostsByCategory = createAsyncThunk(
  'posts/getPostsByCategory',
  async ({ category, page, limit }, thunkAPI) => {
    try {
      const res = await postService.getPostsByCategory(category, { page, limit });
      return { category, ...res.data }; // { posts, pagination }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch category posts';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const postSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
    clearCurrentPost: (state) => {
      state.currentPost = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createPost.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = '';
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.lastCreatedPostId = action.payload?.postId || null;
        state.message = 'Post submitted for moderation';
      })
      .addCase(createPost.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getPosts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getPosts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.posts = action.payload?.posts || [];
        state.pagination = action.payload?.pagination || null;
      })
      .addCase(getPosts.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getPost.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getPost.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentPost = action.payload || null;
      })
      .addCase(getPost.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(updatePost.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updatePost.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.currentPost = action.payload;
        const updateInList = (list) => {
          const idx = list.findIndex((p) => p._id === action.payload._id);
          if (idx !== -1) list[idx] = action.payload;
        };
        updateInList(state.posts);
        updateInList(state.userPosts);
        updateInList(state.categoryPosts);
      })
      .addCase(updatePost.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(deletePost.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        const id = action.payload?.postId;
        if (id) {
          state.posts = state.posts.filter((p) => p._id !== id);
          state.userPosts = state.userPosts.filter((p) => p._id !== id);
          state.categoryPosts = state.categoryPosts.filter((p) => p._id !== id);
          if (state.currentPost?._id === id) state.currentPost = null;
        }
      })
      .addCase(deletePost.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getUserPosts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getUserPosts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userPosts = action.payload?.posts || [];
        state.userPagination = action.payload?.pagination || null;
      })
      .addCase(getUserPosts.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(getPostsByCategory.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getPostsByCategory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categoryPosts = action.payload?.posts || [];
        state.categoryPagination = action.payload?.pagination || null;
      })
      .addCase(getPostsByCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset, clearCurrentPost } = postSlice.actions;
export default postSlice.reducer;
