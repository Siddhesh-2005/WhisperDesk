import axiosInstance from '../config/axios.config';

const authService = {
  sendEmail: async (email) => {
    const response = await axiosInstance.post('/users/send-email', {
      incomingEmail: email,
    });
    
    return response.data;
  },


  login: async (magictoken) => {
    const response = await axiosInstance.get(`/users/login?magictoken=${magictoken}`);

    if (response.data.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }

    return response.data;
  },


  logout: async () => {
    const response = await axiosInstance.post('/users/logout');
    
    localStorage.removeItem('user');
    
    return response.data;
  },


  getUser: async () => {
    const response = await axiosInstance.get('/users/get-user');
    
    if (response.data.data) {
      localStorage.setItem('user', JSON.stringify(response.data.data));
    }
    
    return response.data;
  },
};

export default authService;
