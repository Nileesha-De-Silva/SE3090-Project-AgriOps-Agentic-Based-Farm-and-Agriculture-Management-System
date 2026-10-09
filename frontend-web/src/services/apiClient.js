import axios from 'axios';

// Base Axios instance pointing to Vite proxy or env variable
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const aiApi = axios.create({
  baseURL: import.meta.env.VITE_AI_URL || '/api/crop-analysis-agent',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 90000,
});

// Initial state collections - empty for pure database CRUD
export const INITIAL_MOCK_WORKERS = [];
export const INITIAL_MOCK_TASKS = [];
export const INITIAL_MOCK_APPROVALS = [];

