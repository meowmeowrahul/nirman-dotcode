import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface WardenLayoutProps {
    children: React.ReactNode;
}

const WardenLayout: React.FC<WardenLayoutProps> = ({ children }) => {
    const location = useLocation();

    const navItems = [
        { icon: 'dashboard', label: 'Dashboard', path: '/warden' },
        { icon: 'badge', label: 'KYC Queue', path: '/warden/kyc' },
        { icon: 'menu_book', label: 'Audit Log', path: '/warden/audit' },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="bg-surface text-on-surface min-h-screen flex">
            {/* Sidebar (Desktop) */}
            <aside className="hidden lg:flex flex-col w-72 bg-surface-container-lowest border-r border-outline-variant/10 fixed left-0 top-0 h-full z-40">
                {/* Brand */}
                <div className="p-6 pb-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl primary-gradient flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>propane_tank</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-on-surface tracking-tight">SahayLPG</h1>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-secondary">Warden Portal</p>
                        </div>
                    </div>
                </div>

                {/* Warden Info */}
                <div className="px-6 pb-6">
                    <div className="bg-surface-container-low rounded-xl p-4">
                        <p className="text-sm font-bold text-on-surface">Warden Rao</p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="material-symbols-outlined text-primary text-sm">location_on</span>
                            <span className="text-xs font-medium text-on-surface-variant">Region: MH-PUN-014</span>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive(item.path)
                                    ? 'bg-primary/10 text-primary font-bold'
                                    : 'text-on-surface-variant hover:bg-surface-container-low font-medium'
                                }`}
                        >
                            <span className="material-symbols-outlined" style={isActive(item.path) ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                                {item.icon}
                            </span>
                            <span className="text-sm">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-6">
                    <Link
                        to="/login"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant hover:bg-surface-container-low transition-colors font-medium"
                    >
                        <span className="material-symbols-outlined">logout</span>
                        <span className="text-sm">Sign Out</span>
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 lg:ml-72">
                {/* Top Bar */}
                <header className="bg-surface-container-lowest/85 glass-effect fixed top-0 right-0 left-0 lg:left-72 z-30 border-b border-outline-variant/10">
                    <div className="flex justify-between items-center px-6 py-4">
                        {/* Mobile menu toggle */}
                        <button className="lg:hidden material-symbols-outlined text-on-surface">menu</button>
                        <div className="hidden lg:flex items-center gap-2">
                            <span className="text-sm text-on-surface-variant font-medium">Government Oversight Active</span>
                            <span className="h-2 w-2 bg-secondary rounded-full animate-pulse"></span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button className="material-symbols-outlined text-on-surface/60 hover:bg-surface-container-low p-2 rounded-full transition-colors">
                                notifications
                            </button>
                            <div className="h-10 w-10 rounded-full bg-primary-fixed flex items-center justify-center ring-2 ring-white">
                                <span className="material-symbols-outlined text-on-primary-fixed-variant" style={{ fontVariationSettings: "'FILL' 1" }}>shield_person</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="pt-20 pb-8">{children}</div>
            </div>
        </div>
    );
};

export default WardenLayout;
