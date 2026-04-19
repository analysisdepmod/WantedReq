// api.ts

import axios from 'axios';
export const BASIC_URL1 = import.meta.env.VITE_BASIC_URL1;
export const BASIC_URL = import.meta.env.VITE_BASIC_URL;
export const REPORTS_URL = import.meta.env.VITE_REPORTS_URL;
export const APP_PORT = import.meta.env.VITE_APP_PORT;
export const JASPER_USER = import.meta.env.VITE_JASPER_USER;
export const JASPER_PASS = import.meta.env.VITE_JASPER_PASSWORD;
export const REPORTS_LOGIN_URL = import.meta.env.VITE_REPORTS_LOGIN_URL;

const instance = axios.create({ baseURL: BASIC_URL });

const refreshTokenFun = async (refreshToken: string): Promise<string | null> => {
    try {
        const response = await axios.post(`${BASIC_URL}/Account/refresh`, { refreshToken });
        const { token } = response.data;
        return token;
    } catch (error) {
        console.error('Refresh token failed:', error);
        return null;
    }
};

// Inject token before every request
instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Handle token refresh
instance.interceptors.response.use(
    response => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem('refresh_token');
            if (!refreshToken) {
                window.location.href = '/login';
                return Promise.reject("No refresh token");
            }

            const newToken = await refreshTokenFun(refreshToken);
            if (newToken) {
                localStorage.setItem('token', newToken);
                originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                return axios(originalRequest);
            } else {
                ['token', 'refresh_token', 'refresh_token_expiry'].forEach(item => localStorage.removeItem(item));
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export default instance;