import axiosInstance from '../config/axios.config';

const commentService = {
  createComment: async (postId, content) => {
    const res = await axiosInstance.post(`/comments/posts/${postId}`, { content });
    return res.data;
  },
  getPostComments: async (postId, { page = 1, limit = 10 } = {}) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    const res = await axiosInstance.get(`/comments/posts/${postId}?${params.toString()}`);
    return res.data;
  },
  getComment: async (commentId) => {
    const res = await axiosInstance.get(`/comments/${commentId}`);
    return res.data;
  },
  updateComment: async (commentId, content) => {
    const res = await axiosInstance.put(`/comments/${commentId}`, { content });
    return res.data;
  },
  deleteComment: async (commentId) => {
    const res = await axiosInstance.delete(`/comments/${commentId}`);
    return res.data;
  },
  toggleVisibility: async (commentId) => {
    const res = await axiosInstance.put(`/comments/${commentId}/visibility`);
    return res.data;
  },
  getUserComments: async ({ page = 1, limit = 10 } = {}) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    const res = await axiosInstance.get(`/comments/user/comments?${params.toString()}`);
    return res.data;
  },
  getCommentCount: async (postId) => {
    const res = await axiosInstance.get(`/comments/posts/${postId}/comments/count`);
    return res.data;
  },
};

export default commentService;
