import axios from 'axios';

// Central BASE_URL for the backend API
const FALLBACK_API_BASE_URL = "http://10.190.165.146:5000";
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || FALLBACK_API_BASE_URL;
const BASE_URL = `${API_BASE_URL}/api`;

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

export const getDashboardOverview = async (token) => {
    return await API.get('/dashboard/overview', {
        headers: { Authorization: `Bearer ${token}` },
    });
};

export const getDashboardDetails = async (type, token) => {
    return await API.get(`/dashboard/details/${type}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
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

// Review API Functions
export const getReviewsByProduct = async (productId) => {
    return await API.get(`/reviews/product/${productId}`);
};

export const createReview = async (productId, data, token) => {
    return await API.post(`/reviews/product/${productId}`, data, {
        headers: { Authorization: `Bearer ${token}` },
    });
};

export const updateReview = async (reviewId, data, token) => {
    return await API.put(`/reviews/${reviewId}`, data, {
        headers: { Authorization: `Bearer ${token}` },
    });
};

export const deleteReview = async (reviewId, token) => {
    return await API.delete(`/reviews/${reviewId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
};

// Inventory API Functions
export const getInventoryProducts = async (token) => {
    return await API.get('/inventory', {
        headers: { Authorization: `Bearer ${token}` },
    });
};

export const getLowStockProducts = async (token) => {
    return await API.get('/inventory/low-stock', {
        headers: { Authorization: `Bearer ${token}` },
    });
};

export const updateInventoryStock = async (id, data, token) => {
    return await API.put(`/inventory/${id}/stock`, data, {
        headers: { Authorization: `Bearer ${token}` },
    });
};

export const getInventoryReport = async (token) => {
    return await API.get('/inventory/report', {
        headers: { Authorization: `Bearer ${token}` },
    });
};

// Service and Booking API Functions
export const getServices = async (token) => {
    return await API.get('/services', {
        headers: { Authorization: `Bearer ${token}` },
    });
};

export const createService = async (data, token) => {
    return await API.post('/services', data, {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
        },
    });
};

export const updateService = async (id, data, token) => {
    return await API.put(`/services/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
    });
};

export const deleteService = async (id, token) => {
    return await API.delete(`/services/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
};

export const getServiceAvailability = async (serviceId, date, token) => {
    return await API.get(`/services/${serviceId}/availability`, {
        params: { date },
        headers: { Authorization: `Bearer ${token}` },
    });
};

export const bookService = async (serviceId, data, token) => {
    return await API.post(`/services/${serviceId}/book`, data, {
        headers: { Authorization: `Bearer ${token}` },
    });
};

export const getMyServiceBookings = async (token) => {
    return await API.get('/services/bookings/my', {
        headers: { Authorization: `Bearer ${token}` },
    });
};

export const updateServiceBooking = async (bookingId, data, token) => {
    return await API.put(`/services/bookings/${bookingId}`, data, {
        headers: { Authorization: `Bearer ${token}` },
    });
};

export const cancelServiceBooking = async (bookingId, token) => {
    return await API.put(`/services/bookings/${bookingId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` },
    });
};

export const createPayHereSession = async (data, token) => {
    return await API.post('/payments/payhere/session', data, {
        headers: { Authorization: `Bearer ${token}` },
    });
};

export { API_BASE_URL };
export default API;
