import axiosInstance from '../config/axios.config';

const authService = {
  /**
   * Initiate Azure AD OAuth2 login
   * Gets the authorization URL from backend and redirects user
   */
  initiateLogin: async () => {
    const response = await axiosInstance.get('/users/oauth/login');
    
    if (response.data.data.authUrl) {
      // Redirect user to Azure AD login page
      window.location.href = response.data.data.authUrl;
    }
    
    return response.data;
  },

  /**
   * Handle OAuth callback (user is redirected here after Azure AD login)
   * The backend sets the httpOnly cookie during redirect
   */
  handleOAuthCallback: async () => {
    // Check URL params for success/error
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');
    
    if (error) {
      throw new Error(decodeURIComponent(error));
    }
    
    if (success) {
      // Fetch user data now that we're authenticated
      return await authService.getUser();
    }
    
    throw new Error('Invalid callback state');
  },

  /**
   * Get current authenticated user
   */
  getUser: async () => {
    const response = await axiosInstance.get('/users/get-user');
    
    if (response.data.data) {
      localStorage.setItem('user', JSON.stringify(response.data.data));
    }
    
    return response.data;
  },

  /**
   * Logout user
   */
  logout: async () => {
    const response = await axiosInstance.post('/users/logout');
    
    localStorage.removeItem('user');
    
    return response.data;
  },
};

export default authService;

