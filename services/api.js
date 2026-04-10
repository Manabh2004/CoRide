import axios from 'axios';

// Your PC's local IP — run ipconfig in cmd to find it
const BASE_URL = 'http://10.234.195.218:5000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

export default api;