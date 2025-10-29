import axios from 'axios';

// usa VITE_BASE_URL do .env (via Vite) ou fallback para desenvolvimento local
const baseURL = (import.meta.env.VITE_BASE_URL as string) || 'http://localhost:5000/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export default api;
