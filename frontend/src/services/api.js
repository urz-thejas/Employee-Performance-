import axios from 'axios';

// Use VITE_API_URL in production (Render backend URL), or relative /api in local dev proxy
const API_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchHealth = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

export const fetchDashboard = async ({ department = 'All', category = 'All', search = '' } = {}) => {
  const response = await apiClient.get('/dashboard', {
    params: { department, category, search },
  });
  return response.data;
};

export const fetchEmployees = async ({
  page = 1,
  pageSize = 15,
  department = 'All',
  category = 'All',
  search = '',
  sortBy = 'Employee_ID',
  sortDir = 'asc',
} = {}) => {
  const response = await apiClient.get('/employees', {
    params: {
      page,
      page_size: pageSize,
      department,
      category,
      search,
      sort_by: sortBy,
      sort_dir: sortDir,
    },
  });
  return response.data;
};

export const fetchAnalytics = async () => {
  const response = await apiClient.get('/analytics');
  return response.data;
};

export const fetchModelEvaluation = async () => {
  const response = await apiClient.get('/model/evaluation');
  return response.data;
};

export const fetchFeatureImportance = async () => {
  const response = await apiClient.get('/model/feature-importance');
  return response.data;
};

export const predictEmployeePerformance = async (payload) => {
  const response = await apiClient.post('/predict', payload);
  return response.data;
};

export const uploadDatasetCsv = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getRawCsvDownloadUrl = () => `${API_BASE_URL}/download/raw`;
export const getProcessedCsvDownloadUrl = () => `${API_BASE_URL}/download/processed`;

export default apiClient;
