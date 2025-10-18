import React, { createContext } from 'react';
import type { AuthContextType } from '../types/AuthTypes';
import { useAuthInternal } from './useAuthInternal';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { user, login, register, logout, updateUser, loading } = useAuthInternal();
    return (
        <AuthContext.Provider value={{ user, login, register, logout, updateUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export { AuthContext };
