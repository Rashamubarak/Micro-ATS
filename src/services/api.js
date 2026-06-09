import axios from 'axios';

// Use environment variable for API URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request/response logging
api.interceptors.request.use(request => {
  console.log('API Request:', request.method, request.url);
  return request;
});

api.interceptors.response.use(response => {
  console.log('API Response:', response.status);
  return response;
});

export const candidateAPI = {
  getAll: () => api.get('/candidate'),
  create: (data) => api.post('/candidate', data),
};

export const scheduleAPI = {
  schedule: (data) => api.post('/schedule', data),
  getInterviewerSchedule: (interviewerId) => 
    api.get(`/schedule/interviewer/${interviewerId}`),
  updateStatus: (id, status) => 
    api.patch(`/schedule/${id}/status`, { status }),
};

export { api };