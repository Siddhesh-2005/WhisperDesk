import axiosInstance from '../config/axios.config';

const reportService = {
  createReport: async ({ targetType, targetId, reason }) => {
    const res = await axiosInstance.post('/reports/create', { targetType, targetId, reason });
    return res.data;
  },
  getAllReports: async ({ page = 1, limit = 10, targetType, reason, resolved } = {}) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (targetType) params.append('targetType', targetType);
    if (reason) params.append('reason', reason);
    if (resolved !== undefined) params.append('resolved', resolved);
    const res = await axiosInstance.get(`/reports?${params.toString()}`);
    return res.data;
  },
  getTargetReports: async ({ targetType, targetId }) => {
    const res = await axiosInstance.get(`/reports/${encodeURIComponent(targetType)}/${targetId}`);
    return res.data;
  },
  getUserReports: async ({ page = 1, limit = 10 } = {}) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    const res = await axiosInstance.get(`/reports/user/reports?${params.toString()}`);
    return res.data;
  },
  resolveReport: async (reportId, resolved) => {
    const res = await axiosInstance.put(`/reports/${reportId}/resolve`, { resolved });
    return res.data;
  },
  deleteReport: async (reportId) => {
    const res = await axiosInstance.delete(`/reports/${reportId}`);
    return res.data;
  },
  getReportStats: async () => {
    const res = await axiosInstance.get('/reports/stats');
    return res.data;
  },
};

export default reportService;
