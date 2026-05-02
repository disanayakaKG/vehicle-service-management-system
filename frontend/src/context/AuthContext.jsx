import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser, registerUser, getUserProfile } from '../api/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load stored user data and token on app start
    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const storedToken = await AsyncStorage.getItem('token');
            const storedUser = await AsyncStorage.getItem('user');

            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));

                // Verify token is still valid
                try {
                    const response = await getUserProfile(storedToken);
                    setUser(response.data);
                    await AsyncStorage.setItem('user', JSON.stringify(response.data));
                } catch (err) {
                    // Token expired or network error — clear stored session
                    console.log('Session expired, clearing storage');
                    setToken(null);
                    setUser(null);
                    await AsyncStorage.removeItem('token');
                    await AsyncStorage.removeItem('user');
                }
            }
        } catch (error) {
            // AsyncStorage unavailable or parse error — start fresh
            console.warn('Could not load user data from storage:', error.message);
            setToken(null);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await loginUser({
                email: email.trim().toLowerCase(),
                password
            });
            const { token, ...userData } = response.data;

            setToken(token);
            setUser(userData);

            await AsyncStorage.setItem('token', token);
            await AsyncStorage.setItem('user', JSON.stringify(userData));

            return { success: true };
        } catch (error) {
            const isNetworkError = !error.response;
            return {
                success: false,
                message: isNetworkError
                    ? 'Cannot reach server. Please check backend is running and API URL is correct.'
                    : (error.response?.data?.message || 'Login failed')
            };
        }
    };

    const register = async (data) => {
        try {
            const response = await registerUser(data);
            const { token, ...userData } = response.data;

            setToken(token);
            setUser(userData);

            await AsyncStorage.setItem('token', token);
            await AsyncStorage.setItem('user', JSON.stringify(userData));

            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Registration failed'
            };
        }
    };

    const logout = async () => {
        setToken(null);
        setUser(null);
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
