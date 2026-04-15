import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const LoginPage: React.FC = () => {
    const [role, setRole] = useState<'citizen' | 'warden'>('citizen');
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="bg-surface min-h-screen flex flex-col">
            <main className="flex-grow flex items-center justify-center px-4 py-12 bg-[radial-gradient(circle_at_top_right,_#ffdbcc_0%,_#f7f9fb_60%)]">
                <div className="w-full max-w-md">
                    {/* SecureLPG Identity Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl primary-gradient mb-4 shadow-[0px_10px_30px_rgba(249,115,22,0.2)]">
                            <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>propane_tank</span>
                        </div>
                        <h1 className="text-4xl font-extrabold text-on-surface tracking-[-0.02em] mb-1">SahayLPG</h1>
                        <p className="text-on-surface-variant font-medium tracking-tight">Government Oversight Active</p>
                    </div>

                    {/* Main Auth Card */}
                    <div className="bg-surface-container-lowest rounded-xl p-8 shadow-[0px_10px_30px_rgba(25,28,30,0.06)] border border-outline-variant/20">
                        {/* Role Selector Toggle */}
                        <div className="bg-surface-container-low p-1.5 rounded-xl flex mb-8">
                            <button
                                onClick={() => setRole('citizen')}
                                className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all duration-200 ${role === 'citizen'
                                        ? 'bg-surface-container-lowest text-primary shadow-sm'
                                        : 'text-on-surface-variant font-semibold hover:bg-surface-container-high'
                                    }`}
                            >
                                Citizen
                            </button>
                            <button
                                onClick={() => setRole('warden')}
                                className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all duration-200 ${role === 'warden'
                                        ? 'bg-surface-container-lowest text-primary shadow-sm'
                                        : 'text-on-surface-variant font-semibold hover:bg-surface-container-high'
                                    }`}
                            >
                                Warden
                            </button>
                        </div>

                        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                            {/* Mobile/Email Input */}
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-on-surface-variant tracking-wider uppercase ml-1">Identity</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">person</span>
                                    <input
                                        type="text"
                                        placeholder="Mobile number or email"
                                        className="w-full h-[56px] pl-12 pr-4 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/40 transition-all text-on-surface placeholder:text-outline"
                                    />
                                </div>
                            </div>

                            {/* Password Input */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="block text-xs font-bold text-on-surface-variant tracking-wider uppercase">Security Key</label>
                                    <a href="#" className="text-xs font-semibold text-primary hover:underline">Forgot?</a>
                                </div>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">lock</span>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter password"
                                        className="w-full h-[56px] pl-12 pr-12 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/40 transition-all text-on-surface placeholder:text-outline"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                                    >
                                        <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                                    </button>
                                </div>
                            </div>

                            {/* CTA Button */}
                            <Link to={role === 'citizen' ? '/dashboard' : '/warden'}>
                                <button
                                    type="submit"
                                    className="w-full h-[56px] primary-gradient text-on-primary font-bold rounded-xl active:scale-[0.98] transition-all duration-200 shadow-lg shadow-primary/20 mt-4"
                                >
                                    Secure Sign In
                                </button>
                            </Link>
                        </form>

                        <div className="mt-8 pt-6 border-t border-surface-container-high text-center">
                            <p className="text-on-surface-variant text-sm font-medium">
                                New to SahayLPG?
                                <a href="#" className="text-primary font-bold ml-1 hover:underline">Create Citizen Account</a>
                            </p>
                        </div>
                    </div>

                    {/* Trust Indicators */}
                    <div className="mt-12 grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-4 bg-secondary-container/20 rounded-xl">
                            <div className="w-10 h-10 flex items-center justify-center bg-secondary-container rounded-lg text-on-secondary-container">
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-on-secondary-container tracking-wider uppercase">Verified</p>
                                <p className="text-[12px] font-semibold text-on-surface">Govt Secure</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-surface-container-high rounded-xl">
                            <div className="w-10 h-10 flex items-center justify-center bg-surface-container-highest rounded-lg text-on-surface-variant">
                                <span className="material-symbols-outlined">encrypted</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-on-surface-variant tracking-wider uppercase">Privacy</p>
                                <p className="text-[12px] font-semibold text-on-surface">End-to-End</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-8 text-center bg-surface">
                <p className="text-xs text-outline font-medium">SahayLPG Ecosystem © 2024</p>
                <div className="flex justify-center gap-6 mt-2">
                    <a href="#" className="text-xs font-semibold text-outline hover:text-primary transition-colors">Privacy Policy</a>
                    <a href="#" className="text-xs font-semibold text-outline hover:text-primary transition-colors">Emergency Terms</a>
                    <a href="#" className="text-xs font-semibold text-outline hover:text-primary transition-colors">Support</a>
                </div>
            </footer>
        </div>
    );
};

export default LoginPage;
