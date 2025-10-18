import { useState, useEffect } from 'react';
import { api } from '../api';
import type { AuthContextType } from '../types/AuthTypes';
import type { User } from '../types/UserTypes';

export const useAuthInternal = (): AuthContextType => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const response = await api.get('/auth/me', {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            setUser(response.data);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };
    const login = async (username: string, password: string) => {
        const formData = new FormData();
        formData.append("username", username);
        formData.append("password", password);

        const response = await api.post('/auth/login', formData, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });

        localStorage.setItem("token", response.data.access_token);
        const userRes = await api.get('/auth/me', {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        setUser(userRes.data);
    };

    const register = async (username: string, email: string, password: string) => {
        const response = await api.post('/auth/register', { username, email, password });
        localStorage.setItem("token", response.data.access_token);

        const userRes = await api.get('/auth/me', {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        setUser(userRes.data);
    };

    const logout = () => {
        localStorage.removeItem("token")
        setUser(null);
    };

    const updateUser = async (userData: User) => {
        const response = await api.put('/auth/me', userData, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            },
        });
        setUser(response.data);
    };

    return { user, login, register, logout, updateUser, loading };
};
