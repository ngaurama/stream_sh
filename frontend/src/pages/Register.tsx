// pages/Register.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../contexts/useAuth';
import { AxiosError } from 'axios';

export default function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await register(username, email, password);
            navigate("/")
        } catch (err) {
            if (err instanceof AxiosError) {
                setError(err.response?.data?.detail || 'Login failed');
            } else {
                setError('Login failed');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-8 p-6">
            <h2 className="text-2xl font-bold mb-3">Register to stream_sh</h2>
            {error && <div className="bg-red-500 text-white p-3 mb-4">{error}</div>}
            <div className="max-w-md mx-auto p-6 border-2">
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block mb-2">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full p-2 border"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-2 border"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2 border"
                            required
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-primary text-white p-2 hover:bg-primary-dark"
                    >
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>
                <p className="mt-4 text-center">
                    Already have an account? <Link to="/login" className="text-primary hover:underline">Login</Link>
                </p>
            </div>
        </div>
    );
}
