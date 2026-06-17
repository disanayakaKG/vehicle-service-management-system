import API from './api';

const withAuthHeader = (token) => ({
    headers: { Authorization: `Bearer ${token}` }
});

export const createOrder = async (orderData, token) => {
    try {
        const response = await API.post('/orders', orderData, withAuthHeader(token));
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || error.message;
    }
};

export const getMyOrders = async (token) => {
    try {
        const response = await API.get('/orders/my', withAuthHeader(token));
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || error.message;
    }
};

export const getOrderById = async (id, token) => {
    try {
        const response = await API.get(`/orders/${id}`, withAuthHeader(token));
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || error.message;
    }
};

export const updateOrderStatus = async (id, status, token) => {
    try {
        const response = await API.put(`/orders/${id}/status`, { orderStatus: status }, withAuthHeader(token));
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || error.message;
    }
};

export const updateOrderDetails = async (id, details, token) => {
    try {
        const response = await API.put(`/orders/${id}/details`, details, withAuthHeader(token));
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || error.message;
    }
};

export const cancelOrder = async (id, token) => {
    try {
        const response = await API.put(`/orders/${id}/cancel`, {}, withAuthHeader(token));
        return response.data;
    } catch (error) {
        throw error.response?.data?.message || error.message;
    }
};

export const refundOrder = async (id, token) => {
    try {
        console.log('Attempting refund for order:', id);
        const response = await API.put(`/orders/${id}/refund`, {}, withAuthHeader(token));
        console.log('Refund response:', response);
        return response.data;
    } catch (error) {
        console.error('Refund error:', error);
        console.error('Error response:', error.response);
        console.error('Error message:', error.response?.data?.message);
        throw error.response?.data?.message || error.message;
    }
};
