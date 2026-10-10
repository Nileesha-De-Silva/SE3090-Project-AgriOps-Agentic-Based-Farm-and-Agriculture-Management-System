import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const aiApi = axios.create({
  baseURL: import.meta.env.VITE_AI_URL || (BASE_URL.startsWith('http') ? `${BASE_URL}/crop-analysis-agent` : 'https://agriops-agent2-crop-health.onrender.com'),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 90000,
});

// Initial state collections - empty for pure database CRUD
export const INITIAL_MOCK_WORKERS = [];
export const INITIAL_MOCK_TASKS = [];
export const INITIAL_MOCK_APPROVALS = [];

