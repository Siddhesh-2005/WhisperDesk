import axiosInstance from '../config/axios.config';

const postService = {
  createPost: async ({ title, content, category, image }) => {
    const hasFile = !!image;

    if (hasFile) {
      const formData = new FormData();
      if (title) formData.append('title', title);
      if (category) formData.append('category', category);
      formData.append('content', content);
      formData.append('image', image);

      const res = await axiosInstance.post('/posts/create-post', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    }

    const res = await axiosInstance.post('/posts/create-post', {
      title,
      content,
      category,
    });
    return res.data;
  },

  getPosts: async ({ page = 1, limit = 10, category, search } = {}) => {
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (category) params.append('category', category);
    if (search) params.append('search', search);

    const res = await axiosInstance.get(`/posts?${params.toString()}`);
    return res.data;
  },

  getPost: async (postId) => {
    const res = await axiosInstance.get(`/posts/${postId}`);
    return res.data;
  },

  updatePost: async (postId, { title, content, category }) => {
    const payload = {};
    if (title !== undefined) payload.title = title;
    if (content !== undefined) payload.content = content;
    if (category !== undefined) payload.category = category;

    const res = await axiosInstance.put(`/posts/${postId}`, payload);
    return res.data;
  },

  deletePost: async (postId) => {
    const res = await axiosInstance.delete(`/posts/${postId}`);
    return res.data;
  },

  getUserPosts: async ({ page = 1, limit = 10 } = {}) => {
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);

    const res = await axiosInstance.get(`/posts/user/posts?${params.toString()}`);
    return res.data;
  },

  getPostsByCategory: async (category, { page = 1, limit = 10 } = {}) => {
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);

    const res = await axiosInstance.get(`/posts/category/${encodeURIComponent(category)}?${params.toString()}`);
    return res.data;
  },
};

export default postService;
