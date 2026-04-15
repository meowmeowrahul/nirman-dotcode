import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface CitizenLayoutProps {
    children: React.ReactNode;
    activeTab?: 'home' | 'requests' | 'profile';
}

const CitizenLayout: React.FC<CitizenLayoutProps> = ({ children, activeTab = 'home' }) => {
    const location = useLocation();

    const navItems = [
        { id: 'home', icon: 'home', label: 'Home', path: '/dashboard' },
        { id: 'requests', icon: 'emergency_share', label: 'Requests', path: '/request' },
        { id: 'profile', icon: 'person', label: 'Profile', path: '/profile' },
    ];

    return (
        <div className="bg-surface text-on-surface min-h-screen">
            {/* Top App Bar */}
            <header className="bg-[#f7f9fb]/85 glass-effect fixed top-0 w-full z-50">
                <div className="flex justify-between items-center px-6 py-4 w-full">
                    <div className="flex items-center gap-3">
                        <Link to="/dashboard" className="text-xl font-bold text-on-surface tracking-[-0.02em]">SahayLPG</Link>
                        <div className="hidden md:flex items-center bg-surface-container-low px-3 py-1.5 rounded-full gap-2">
                            <span className="material-symbols-outlined text-primary text-sm">location_on</span>
                            <span className="text-sm font-medium">Kothrud Region, Pune</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="material-symbols-outlined text-on-surface/60 hover:bg-surface-container-low p-2 rounded-full transition-colors">notifications</button>
                        <Link to="/profile" className="h-10 w-10 rounded-full bg-primary-fixed overflow-hidden ring-2 ring-white flex items-center justify-center">
                            <span className="material-symbols-outlined text-on-primary-fixed-variant" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                        </Link>
                    </div>
                </div>
            </header>

            {children}

            {/* Bottom Nav Bar (Mobile) */}
            <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-6 pt-2 bg-white/85 glass-effect md:hidden z-50 rounded-t-xl shadow-[0px_-10px_30px_rgba(25,28,30,0.06)]">
                {navItems.map((item) => (
                    <Link
                        key={item.id}
                        to={item.path}
                        className={`flex flex-col items-center justify-center px-5 py-2 transition-all active:scale-90 duration-200 ${activeTab === item.id
                                ? 'bg-surface-container-low text-primary rounded-xl'
                                : 'text-on-surface/40 hover:opacity-80'
                            }`}
                    >
                        <span
                            className="material-symbols-outlined"
                            style={activeTab === item.id ? { fontVariationSettings: "'FILL' 1" } : undefined}
                        >
                            {item.icon}
                        </span>
                        <span className="text-[11px] font-medium uppercase tracking-wider mt-1">{item.label}</span>
                    </Link>
                ))}
            </nav>

            {/* FAB (Mobile) */}
            <button className="md:hidden fixed bottom-24 right-6 bg-primary text-on-primary h-14 w-14 rounded-full shadow-[0px_10px_30px_rgba(249,115,22,0.3)] flex items-center justify-center active:scale-95 transition-transform z-40">
                <span className="material-symbols-outlined">add</span>
            </button>
        </div>
    );
};

export default CitizenLayout;
