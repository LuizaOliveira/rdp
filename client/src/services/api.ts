import axios from 'axios';

const api = axios.create({
  baseURL: 'https://back-rdp-production.up.railway.app/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export default api;
