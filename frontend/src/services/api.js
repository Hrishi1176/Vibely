import axios from 'axios';
import { toast } from '../context/ToastContext';

// Support Vercel environment variable with local fallback
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isAuthFailure = false;
let authCheckCompleted = false;

const normalizeUrl = (url = '') => url.toLowerCase();

const getRequestUrl = (config) => {
  if (!config) return '';
  const url = config.url || '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const baseURL = config.baseURL || API_BASE_URL || '';
  return `${baseURL.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
};

const isAuthEndpoint = (url = '') => {
  const normalizedUrl = normalizeUrl(url);
  return normalizedUrl.includes('/auth/login') || normalizedUrl.includes('/auth/register');
};

const isAuthStatusCheck = (url = '') => {
  const normalizedUrl = normalizeUrl(url);
  return normalizedUrl.includes('/auth/me');
};

export const resetAuthFailure = () => {
  isAuthFailure = false;
};

export const markAuthCheckCompleted = () => {
  authCheckCompleted = true;
};

api.interceptors.request.use(
  (config) => {
    if (isAuthFailure && !isAuthEndpoint(config.url) && !isAuthStatusCheck(config.url)) {
      const blockedError = new Error('Session expired. Please log in again.');
      blockedError.isAuthBlocked = true;
      return Promise.reject(blockedError);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global Response Interceptor to capture network & server failures
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ERR_NETWORK') {
      toast.error('Network error. Backend server is unreachable.');
    } else if (error.response?.status === 401 || error.response?.status === 403) {
      const requestUrl = getRequestUrl(error.config);
      const isSilent = isAuthEndpoint(requestUrl) || isAuthStatusCheck(requestUrl);
      if (!authCheckCompleted) {
        return Promise.reject(error);
      }
      if (!isSilent && !isAuthFailure) {
        isAuthFailure = true;
        toast.error('Session expired. Please log in again.');
      }
    } else if (error.response?.status >= 500) {
      toast.error('Server error occurred. Please try again later.');
    }
    return Promise.reject(error);
  }
);


export const authAPI = {
  register: (data) => api.post('/auth/register', data).then((response) => {
    resetAuthFailure();
    return response;
  }),
  login: (username, password) => {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    return api.post('/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).then((response) => {
      resetAuthFailure();
      return response;
    });
  },
  logout: () => api.post('/auth/logout').finally(() => {
    resetAuthFailure();
  }),
  getMe: () => api.get('/auth/me'),
  generateUsername: (name = '', count = 5) => api.get(`/auth/generate-username?count=${count}${name ? `&name=${encodeURIComponent(name)}` : ''}`),
};


export const postsAPI = {
  getFeed: (skip = 0, limit = 20) => api.get(`/posts?skip=${skip}&limit=${limit}`),
  createPost: (data) => api.post('/posts', data),
  toggleLike: (postId) => api.post(`/posts/${postId}/like`),
  addComment: (postId, content) => api.post(`/posts/${postId}/comments`, { content }),
  getComments: (postId) => api.get(`/posts/${postId}/comments`),
  getPlatformStats: () => api.get('/posts/stats'),
  getTrendingTags: (limit = 8) => api.get(`/posts/trending?limit=${limit}`),
};


export const usersAPI = {
  getProfile: (username) => api.get(`/users/${username}`),
  updateProfile: (data) => api.put('/users/me', data),
  toggleFollow: (userId) => api.post(`/users/${userId}/follow`),
  searchUsers: (query = '') => api.get(`/users/search/query?q=${encodeURIComponent(query)}`),
  getSuggestions: () => api.get('/users/suggestions/list'),
};

export const messagesAPI = {
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (userId) => api.get(`/messages/${userId}`),
  sendMessage: (userId, data) => api.post(`/messages/${userId}`, data),
  updateMessage: (messageId, content) => api.patch(`/messages/${messageId}`, { content }),
  deleteMessage: (messageId, scope = 'me') => api.delete(`/messages/${messageId}?scope=${scope}`),
};

export const aiAPI = {
  generateCaption: (prompt, vibe) => api.post('/ai/generate-caption', { prompt, vibe }),
  generateImage: (prompt, width = 1024, height = 1024) => api.post('/ai/generate-image', { prompt, width, height }),
  chat: (message) => api.post('/ai/assistant', { message }),
  moderate: (text) => api.post('/ai/moderate', { text }),
};


export const quotaAPI = {
  getMyQuota: () => api.get('/quotas/my-quota'),
};

export default api;
