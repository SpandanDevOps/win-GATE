import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (email, password, name) =>
    apiClient.post('/auth/register', { email, password, name }),
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }),
  getCurrentUser: () =>
    apiClient.get('/auth/me')
};

export const studyHoursAPI = {
  saveDayHours: (month, year, day, hours) =>
    apiClient.post('/study-hours/save-day', { month, year, day, hours }),
  getMonthData: (month, year) =>
    apiClient.get(`/study-hours/month/${month}/${year}`),
  getAllData: () =>
    apiClient.get('/study-hours/all')
};

export const curriculumAPI = {
  saveTopic: (data) =>
    apiClient.post('/curriculum/save', data),
  getAll: () =>
    apiClient.get('/curriculum/all')
};

export default apiClient;
