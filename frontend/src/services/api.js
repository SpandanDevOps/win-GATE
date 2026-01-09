import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Visitor API (no authentication, just visitor ID)
export const visitorAPI = {
  register: (visitorId) =>
    apiClient.post('/visitor/register', { visitorId }),
  
  getStudyHours: (visitorId, month, year) =>
    apiClient.get(`/visitor/study-hours/${visitorId}/${month}/${year}`),
  
  saveStudyHours: (visitorId, month, year, day, hours) =>
    apiClient.post('/visitor/study-hours/save', { visitorId, month, year, day, hours }),
  
  getCurriculum: (visitorId) =>
    apiClient.get(`/visitor/curriculum/${visitorId}`),
  
  saveCurriculum: (visitorId, subject, topic, watched, revised, tested) =>
    apiClient.post('/visitor/curriculum/save', { visitorId, subject, topic, watched, revised, tested }),
  
  getAllData: (visitorId) =>
    apiClient.get(`/visitor/data/${visitorId}`),
  
  deleteAllData: (visitorId) =>
    apiClient.delete(`/visitor/data/${visitorId}`)
};

export const authAPI = {
  register: (email, password, name) =>
    apiClient.post('/auth/register', { email, password, name }),
  verifyOTP: (email, otp) =>
    apiClient.post('/auth/verify-otp', { email, otp }),
  resendOTP: (email) =>
    apiClient.post('/auth/resend-otp', { email }),
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
