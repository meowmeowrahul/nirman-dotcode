import React from 'react';
import WardenLayout from '../../layouts/WardenLayout';

const WardenDashboardPage: React.FC = () => {
    const kpiCards = [
        { label: 'Pending KYCs', value: '23', icon: 'badge', color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10' },
        { label: 'Active Emergency Requests', value: '7', icon: 'emergency_share', color: 'text-tertiary', bg: 'bg-tertiary/10' },
        { label: 'Cylinders Shared Today', value: '42', icon: 'propane_tank', color: 'text-secondary', bg: 'bg-secondary/10' },
        { label: 'Total Citizens', value: '1,284', icon: 'group', color: 'text-primary', bg: 'bg-primary/10' },
    ];

    return (
        <WardenLayout>
            <div className="px-6 lg:px-10 max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">Regional Dashboard</h1>
                    <p className="text-on-surface-variant mt-2">Real-time overview of your assigned region MH-PUN-014.</p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {kpiCards.map((kpi) => (
                        <div key={kpi.label} className="bg-surface-container-lowest rounded-xl p-6 shadow-[0px_10px_30px_rgba(25,28,30,0.06)]">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 ${kpi.bg} rounded-xl flex items-center justify-center`}>
                                    <span className={`material-symbols-outlined ${kpi.color} text-xl`} style={{ fontVariationSettings: "'FILL' 1" }}>{kpi.icon}</span>
                                </div>
                                <span className="material-symbols-outlined text-outline/40 text-sm">trending_up</span>
                            </div>
                            <p className="text-3xl font-black text-on-surface">{kpi.value}</p>
                            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mt-1">{kpi.label}</p>
                        </div>
                    ))}
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Live Map */}
                    <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0px_10px_30px_rgba(25,28,30,0.06)]">
                        <div className="flex items-center justify-between p-6 pb-0">
                            <div>
                                <h3 className="text-lg font-bold">Live Regional Map</h3>
                                <p className="text-xs text-on-surface-variant mt-1">Socket.io real-time feed • MH-PUN-014</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 bg-secondary rounded-full animate-pulse"></span>
                                <span className="text-xs font-semibold text-secondary">Live</span>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="rounded-xl h-80 bg-inverse-surface/5 overflow-hidden relative">
                                <div className="w-full h-full bg-gradient-to-br from-surface-container-low via-surface-container to-surface-container-high flex items-center justify-center">
                                    <div className="text-center">
                                        <span className="material-symbols-outlined text-6xl text-outline/30">map</span>
                                        <p className="text-sm text-outline mt-2 font-medium">Kothrud Region, Pune</p>
                                    </div>
                                </div>
                                {/* Active Points */}
                                <div className="absolute top-[30%] left-[40%]">
                                    <div className="w-3 h-3 bg-tertiary rounded-full shadow-[0_0_15px_rgba(207,44,48,0.5)] animate-pulse"></div>
                                </div>
                                <div className="absolute top-[50%] left-[60%]">
                                    <div className="w-3 h-3 bg-tertiary rounded-full shadow-[0_0_15px_rgba(207,44,48,0.5)] animate-pulse"></div>
                                </div>
                                <div className="absolute top-[65%] left-[35%]">
                                    <div className="w-3 h-3 bg-secondary rounded-full shadow-[0_0_15px_rgba(0,108,73,0.5)]"></div>
                                </div>
                                <div className="absolute top-[45%] left-[25%]">
                                    <div className="w-3 h-3 bg-secondary rounded-full shadow-[0_0_15px_rgba(0,108,73,0.5)]"></div>
                                </div>
                                {/* Legend */}
                                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-xl p-3 flex gap-4 shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-tertiary rounded-full"></span>
                                        <span className="text-[10px] font-bold text-on-surface">Active Requests</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-secondary rounded-full"></span>
                                        <span className="text-[10px] font-bold text-on-surface">Matched</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="lg:col-span-5 bg-surface-container-lowest rounded-xl p-6 shadow-[0px_10px_30px_rgba(25,28,30,0.06)]">
                        <h3 className="text-lg font-bold mb-6">Recent Activity</h3>
                        <div className="space-y-4">
                            {[
                                { action: 'KYC approved for Priya M.', time: '5 min ago', icon: 'badge', color: 'text-secondary bg-secondary/10' },
                                { action: 'Emergency request from Sector 4', time: '12 min ago', icon: 'emergency_share', color: 'text-tertiary bg-tertiary/10' },
                                { action: 'Cylinder exchanged (PIN: 7294)', time: '23 min ago', icon: 'handshake', color: 'text-secondary bg-secondary/10' },
                                { action: 'New KYC submission received', time: '1 hour ago', icon: 'person_add', color: 'text-primary bg-primary/10' },
                                { action: 'Transaction flagged for review', time: '2 hours ago', icon: 'flag', color: 'text-[#F59E0B] bg-[#F59E0B]/10' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-low transition-colors">
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.color}`}>
                                        <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-on-surface text-sm truncate">{item.action}</p>
                                        <p className="text-[11px] text-on-surface-variant">{item.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </WardenLayout>
    );
};

export default WardenDashboardPage;
