import axiosInstance from '../config/axios.config';

const likeService = {
  toggleLike: async (postId) => {
    const res = await axiosInstance.post(`/posts/${postId}/like`);
    return res.data;
  },
  checkLikeStatus: async (postId) => {
    const res = await axiosInstance.get(`/posts/${postId}/like`);
    return res.data;
  },
  getPostLikes: async (postId, { page = 1, limit = 20 } = {}) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    const res = await axiosInstance.get(`/posts/${postId}/likes?${params.toString()}`);
    return res.data;
  },
  getUserLikes: async ({ page = 1, limit = 10 } = {}) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    const res = await axiosInstance.get(`/posts/user/likes?${params.toString()}`);
    return res.data;
  },
};

export default likeService;
