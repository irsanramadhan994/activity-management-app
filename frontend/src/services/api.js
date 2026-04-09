import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    getProfile: () => api.get('/auth/me'),
    getUsers: () => api.get('/auth/users'),
};

// Activities API
export const activitiesAPI = {
    getAll: (params) => api.get('/activities', { params }),
    getOne: (id) => api.get(`/activities/${id}`),
    create: (data) => api.post('/activities', data),
    update: (id, data) => api.put(`/activities/${id}`, data),
    delete: (id) => api.delete(`/activities/${id}`),
    getCalendarEvents: (params) => api.get('/activities/calendar/events', { params }),
};

// Reports API
export const reportsAPI = {
    create: (formData) => api.post('/reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    getByActivity: (activityId) => api.get(`/reports/${activityId}`),
    getAll: () => api.get('/reports'),
};

// Admin API
export const adminAPI = {
    getActivities: (params) => api.get('/admin/activities', { params }),
    getActivityDetails: (id) => api.get(`/admin/activities/${id}`),
    setReminder: (id, reminderTime) => api.put(`/admin/activities/${id}/reminder`, { reminderTime }),
    removeReminder: (id) => api.delete(`/admin/activities/${id}/reminder`),
    getUsers: (params) => api.get('/admin/users', { params }),
    getStats: () => api.get('/admin/stats'),
};

// Notifications API
export const notificationsAPI = {
    send: (activityId, message) => api.post('/notifications/send', { activityId, message }),
    test: (phoneNumber, message) => api.post('/notifications/test', { phoneNumber, message }),
};

export default api;
