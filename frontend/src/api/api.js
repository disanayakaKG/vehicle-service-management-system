import axios from 'axios';

// Central BASE_URL for the backend API
const BASE_URL = "http://10.190.165.146:5000/api";
const API_BASE_URL = "http://10.190.165.146:5000";

const API = axios.create({
    baseURL: BASE_URL,
});

// Auth API Functions
export const registerUser = async (data) => {
    return await API.post('/auth/register', data);
};

export const loginUser = async (data) => {
    return await API.post('/auth/login', data);
};

export const getUserProfile = async (token) => {
    return await API.get('/auth/profile', {
        headers: { Authorization: `Bearer ${token}` },
    });
};

// Product API Functions
export const getProducts = async (params) => {
    return await API.get('/products', { params });
};

export const getDashboardOverview = async () => {
    return await API.get('/dashboard/overview');
};

export const getTopRatedProducts = async () => {
    return await API.get('/products/top-rated');
};

export const getProductById = async (id) => {
    return await API.get(`/products/${id}`);
};

export const createProduct = async (formData, token) => {
    return await API.post('/products', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
        },
    });
};

export const updateProduct = async (id, formData, token) => {
    return await API.put(`/products/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
        },
    });
};

export const deleteProduct = async (id, token) => {
    return await API.delete(`/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
};

export { API_BASE_URL };
export default API;
