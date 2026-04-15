import React from 'react';
import { Link } from 'react-router-dom';
import CitizenLayout from '../layouts/CitizenLayout';

const DashboardPage: React.FC = () => {
    return (
        <CitizenLayout activeTab="home">
            <main className="pt-24 px-6 max-w-7xl mx-auto space-y-10 pb-32">
                {/* Trust Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <span className="text-secondary font-semibold text-xs tracking-wider uppercase mb-2 block">Government Oversight Active</span>
                        <h1 className="text-4xl font-extrabold tracking-tight text-on-surface">Welcome back, Rohan</h1>
                        <p className="text-on-surface-variant mt-2 text-lg">Your community has shared 12 cylinders today.</p>
                    </div>
                    <div className="flex items-center gap-2 bg-secondary-container/30 px-4 py-2 rounded-full">
                        <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                        <span className="text-on-secondary-container font-bold text-sm">Verified Citizen</span>
                    </div>
                </div>

                {/* Hero Action Grid (Asymmetric) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Lend LPG */}
                    <Link to="/lend" className="md:col-span-7 relative overflow-hidden bg-secondary rounded-xl p-8 min-h-[300px] flex flex-col justify-between group shadow-[0px_10px_30px_rgba(0,108,73,0.1)]">
                        <div className="relative z-10">
                            <h2 className="text-white text-3xl font-bold mb-3">Lend LPG</h2>
                            <p className="text-white/80 max-w-xs text-lg leading-relaxed">Have an extra cylinder? Support a neighbor in need and earn community trust credits.</p>
                        </div>
                        <div className="relative z-10">
                            <span className="bg-white text-secondary px-8 py-4 rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 w-fit">
                                Start Lending
                                <span className="material-symbols-outlined">arrow_forward</span>
                            </span>
                        </div>
                        <div className="absolute -right-10 -bottom-10 opacity-20 transform rotate-12 group-hover:scale-110 transition-transform duration-500">
                            <span className="material-symbols-outlined text-[200px] text-white">propane_tank</span>
                        </div>
                    </Link>

                    {/* Request LPG */}
                    <Link to="/request" className="md:col-span-5 relative overflow-hidden bg-tertiary-container rounded-xl p-8 flex flex-col justify-between group shadow-[0px_10px_30px_rgba(207,44,48,0.1)] min-h-[300px]">
                        <div className="relative z-10">
                            <h2 className="text-white text-3xl font-bold mb-3">Request LPG</h2>
                            <p className="text-white/80 text-lg leading-relaxed">Running low? Broadcast a request to nearby neighbors for immediate supply assistance.</p>
                        </div>
                        <div className="relative z-10">
                            <span className="bg-white text-tertiary px-8 py-4 rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 w-fit">
                                Post Request
                                <span className="material-symbols-outlined">emergency_share</span>
                            </span>
                        </div>
                        <div className="absolute top-6 right-6">
                            <div className="h-3 w-3 bg-white rounded-full animate-pulse shadow-[0_0_15px_rgba(255,255,255,0.8)]"></div>
                        </div>
                    </Link>
                </div>

                {/* Content Bento Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Recent Activity Card */}
                    <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl p-8 shadow-[0px_10px_30px_rgba(25,28,30,0.06)]">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold">Successful Shares Nearby</h3>
                            <button className="text-primary font-semibold text-sm hover:underline">View All</button>
                        </div>
                        <div className="space-y-6">
                            {/* Activity Item 1 */}
                            <div className="flex items-center gap-5 p-4 rounded-xl hover:bg-surface-container-low transition-colors">
                                <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>handshake</span>
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-on-surface">Amit K. shared with Priya S.</p>
                                    <p className="text-sm text-on-surface-variant">14 mins ago • Sector 4, Kothrud</p>
                                </div>
                                <span className="bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded">Fulfilled</span>
                            </div>
                            {/* Activity Item 2 */}
                            <div className="flex items-center gap-5 p-4 rounded-xl hover:bg-surface-container-low transition-colors">
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>local_shipping</span>
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-on-surface">Neighborhood Pool Refilled</p>
                                    <p className="text-sm text-on-surface-variant">2 hours ago • Sahay Hub Pune</p>
                                </div>
                                <span className="bg-surface-container-high text-on-surface-variant text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded">Stocked</span>
                            </div>
                            {/* Activity Item 3 */}
                            <div className="flex items-center gap-5 p-4 rounded-xl hover:bg-surface-container-low transition-colors">
                                <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>volunteer_activism</span>
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-on-surface">Sunil M. donated trust credits</p>
                                    <p className="text-sm text-on-surface-variant">5 hours ago • Kothrud West</p>
                                </div>
                                <span className="bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded">Community</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Trust Score Card */}
                        <div className="bg-surface-container-low rounded-xl p-6 flex flex-col items-center text-center">
                            <div className="mb-4 relative">
                                <svg className="w-32 h-32 transform -rotate-90">
                                    <circle className="text-surface-variant" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeWidth="8" />
                                    <circle className="text-secondary" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeDasharray="364.4" strokeDashoffset="91.1" strokeWidth="8" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-2xl font-black">940</span>
                                    <span className="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant">Trust Score</span>
                                </div>
                            </div>
                            <h4 className="font-bold text-lg mb-1">Excellent Standing</h4>
                            <p className="text-sm text-on-surface-variant px-4">Your helpfulness rating is in the top 5% of Kothrud residents.</p>
                        </div>

                        {/* Neighborhood Map Snapshot */}
                        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-[0px_10px_30px_rgba(25,28,30,0.06)] overflow-hidden">
                            <div className="flex items-center justify-between mb-3 px-2">
                                <span className="text-xs font-bold uppercase text-on-surface-variant">Live Supply Map</span>
                                <div className="flex items-center gap-1">
                                    <span className="h-2 w-2 bg-error rounded-full"></span>
                                    <span className="text-[10px] font-medium">3 Pending</span>
                                </div>
                            </div>
                            <div className="rounded-lg h-40 bg-surface-variant overflow-hidden relative">
                                <div className="w-full h-full bg-gradient-to-br from-surface-container-low via-surface-container to-surface-container-high flex items-center justify-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="material-symbols-outlined text-4xl text-outline/40">map</span>
                                        <span className="text-xs text-outline font-medium">Kothrud, Pune</span>
                                    </div>
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="bg-white/90 backdrop-blur text-[10px] font-bold py-1 px-3 rounded-full shadow-sm">Click to expand map</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </CitizenLayout>
    );
};

export default DashboardPage;
