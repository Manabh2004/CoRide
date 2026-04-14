import axios from 'axios';

const BASE_URL = 'https://coride-backend-hqwr.onrender.com';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

export default api;