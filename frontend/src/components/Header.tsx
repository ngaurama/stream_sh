// components/Header.tsx
import { Link } from "react-router";
import { useAuth } from "../contexts/useAuth";
import { useState, useRef, useEffect } from "react";
import { IMAGE_URL } from "../api";

const ALL_THEMES = [
  { filename: "black_and_white", displayName: "Black and White" },
  { filename: "blue_screen", displayName: "Blue Screen" },
  { filename: "heliotrope", displayName: "Heliotrope" },
  { filename: "hopbush", displayName: "Hopbush" },
  { filename: "matrix", displayName: "Matrix" },
  { filename: "pink_panther", displayName: "Pink Panther" },
  { filename: "pistachio", displayName: "Pistachio" },
  { filename: "studio", displayName: "Studio" },
  { filename: "tahiti_gold", displayName: "Tahiti Gold" },
  { filename: "teal", displayName: "Teal" },
  { filename: "terminal_dark", displayName: "Terminal Dark" },
  { filename: "terminal_light", displayName: "Terminal Light" },
  { filename: "tomato", displayName: "Tomato" },
  { filename: "vanilla_sky", displayName: "Vanilla Sky" },
  { filename: "viking", displayName: "Viking" },
  { filename: "white_and_black", displayName: "White and Black" }
];

export default function Header() {
    const { user, logout } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);
    const [showThemes, setShowThemes] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const themesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getProfilePictureUrl = () => {
        if (!user?.profile_picture) return "/default-avatar.png";
        if (user.profile_picture.startsWith('http')) return user.profile_picture;
        return `${IMAGE_URL}${user.profile_picture}`;
    };

    const changeTheme = (themeFilename: string) => {
        const existingTheme = document.querySelector('link[data-theme]');
        if (existingTheme) {
            existingTheme.remove();
        }

        const themeLink = document.createElement('link');
        themeLink.rel = 'stylesheet';
        themeLink.href = `/themes/${themeFilename}.css`;
        themeLink.dataset.theme = 'true';
        
        document.head.appendChild(themeLink);
        
        localStorage.setItem('selectedTheme', themeFilename);
        
        setShowThemes(false);
        setShowDropdown(false);
    };

    useEffect(() => {
        const savedTheme = localStorage.getItem('selectedTheme');
        if (savedTheme && savedTheme !== 'pistachio') {
            changeTheme(savedTheme);
        }
    }, []);

    return (
        <header className="header bg-[var(--background)] fixed h-19 top-0 left-0 right-0 flex justify-between items-center p-4 border-b-2 z-50">
            <h1 className="text-xl">
                <Link to={"/"} className="hover:underline">stream_sh</Link>
            </h1>
            
            <nav className="flex items-center gap-4">
                {user ? (
                    <>
                        <Link to="/stream/create" className="link-live px-4 py-2 border-4">
                            Go Live
                        </Link>
                        
                        {/* User Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setShowDropdown(!showDropdown)}
                                className="flex items-center gap-2 focus:outline-none"
                            >
                                <img
                                    src={getProfilePictureUrl()}
                                    alt="Profile"
                                    className="w-8 h-8 object-cover border-2 border-gray-300 rounded-full"
                                />
                                <span className="hidden sm:block">{user.username}</span>
                                <svg 
                                    className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Dropdown Menu */}
                            {showDropdown && (
                                <div className="absolute bg-[var(--background)] right-0 mt-2 w-48 shadow-lg border-2 z-50">
                                    <Link
                                        to="/account"
                                        className="block px-4 py-4 border-b-1 text-sm  hover:bg-[var(--foreground)]/10"
                                        onClick={() => setShowDropdown(false)}
                                    >
                                        Account Settings
                                    </Link>
                                    <div
                                        className="relative"
                                        onMouseEnter={() => setShowThemes(true)}
                                        onMouseLeave={() => setShowThemes(false)}
                                    >
                                        <Link to="#" className="w-full text-left px-4 py-4 border-b-1 text-sm hover:bg-[var(--foreground)]/10 flex justify-between items-center">
                                            <span>Themes</span>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </Link>
                                        {showThemes && (
                                            <div 
                                                ref={themesRef}
                                                className="absolute right-full top-0 ml-2 bg-[var(--background)] shadow-lg border-2 w-48 max-h-64 overflow-y-auto scrollbar-thin z-50"
                                            >
                                                {ALL_THEMES.map((theme) => (
                                                    <Link
                                                        to="#"
                                                        key={theme.filename}
                                                        onClick={() => changeTheme(theme.filename)}
                                                        className="block w-full border-b-1 text-left px-4 py-4 hover:bg-[var(--foreground)]/10 cursor-pointer text-sm"
                                                    >
                                                        {theme.displayName}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <Link
                                        to="/"
                                        onClick={logout}
                                        className="link-danger block px-4 py-4 text-sm"
                                    >
                                        Logout
                                    </Link>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <Link to="/login" className="hover:underline">Login</Link>
                        <Link to="/register" className="hover:underline">Register</Link>
                    </>
                )}
            </nav>
        </header>
    );
}
