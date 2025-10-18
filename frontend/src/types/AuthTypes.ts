import type { User } from "./UserTypes";

export interface AuthContextType {
    user: User | null;
    login: (username: string, password: string) => Promise<void>;
    register: (username: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    updateUser: (userData: User) => Promise<void>;
    loading: boolean;
}
