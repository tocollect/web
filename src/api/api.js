import axios from "axios";
import {getToken} from "./auth.js";

//const API_BASE_URL = "http://localhost:8080/api";
const API_BASE_URL = "https://tocollect.ngrok.app/api";

const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
    'Accept':'application/json'
  },
  baseURL: API_BASE_URL,
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


export { api };