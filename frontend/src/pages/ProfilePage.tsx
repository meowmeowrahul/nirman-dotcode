import React from 'react';
import { Link } from 'react-router-dom';
import CitizenLayout from '../layouts/CitizenLayout';

const ProfilePage: React.FC = () => {
    return (
        <CitizenLayout activeTab="profile">
            <main className="pt-24 pb-32 px-6 max-w-3xl mx-auto min-h-screen space-y-8">
                {/* Profile Header */}
                <div className="bg-surface-container-lowest rounded-xl p-8 shadow-[0px_10px_30px_rgba(25,28,30,0.06)]">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                        <div className="w-24 h-24 rounded-full bg-primary-fixed flex items-center justify-center ring-4 ring-white shadow-lg">
                            <span className="material-symbols-outlined text-on-primary-fixed-variant text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                        </div>
                        <div className="text-center sm:text-left flex-1">
                            <h1 className="text-2xl font-extrabold text-on-surface">Rohan Deshmukh</h1>
                            <p className="text-on-surface-variant mt-1">rohan.d@email.com • +91 98765 43210</p>
                            <div className="flex flex-wrap gap-3 mt-3 justify-center sm:justify-start">
                                <span className="inline-flex items-center gap-1.5 bg-secondary-container/30 px-3 py-1.5 rounded-full">
                                    <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                                    <span className="text-xs font-bold text-on-secondary-container">KYC Verified</span>
                                </span>
                                <span className="inline-flex items-center gap-1.5 bg-surface-container-high px-3 py-1.5 rounded-full">
                                    <span className="material-symbols-outlined text-primary text-sm">location_on</span>
                                    <span className="text-xs font-bold text-on-surface-variant">Kothrud, Pune</span>
                                </span>
                            </div>
                        </div>
                        <Link to="/kyc" className="text-primary font-semibold text-sm hover:underline flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">edit</span>
                            Edit
                        </Link>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Trust Score', value: '940', icon: 'shield', color: 'text-secondary' },
                        { label: 'Cylinders Shared', value: '12', icon: 'propane_tank', color: 'text-primary' },
                        { label: 'Requests Made', value: '3', icon: 'emergency_share', color: 'text-tertiary' },
                        { label: 'Community Rank', value: 'Top 5%', icon: 'military_tech', color: 'text-primary' },
                    ].map((stat) => (
                        <div key={stat.label} className="bg-surface-container-lowest rounded-xl p-5 shadow-[0px_10px_30px_rgba(25,28,30,0.06)] text-center">
                            <span className={`material-symbols-outlined text-2xl ${stat.color} mb-2`} style={{ fontVariationSettings: "'FILL' 1" }}>{stat.icon}</span>
                            <p className="text-2xl font-black text-on-surface">{stat.value}</p>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mt-1">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Activity History */}
                <div className="bg-surface-container-lowest rounded-xl p-8 shadow-[0px_10px_30px_rgba(25,28,30,0.06)]">
                    <h3 className="text-xl font-bold mb-6">Activity History</h3>
                    <div className="space-y-4">
                        {[
                            { action: 'Shared LPG with Priya S.', time: '2 hours ago', type: 'share', status: 'Completed' },
                            { action: 'Emergency request fulfilled', time: '1 day ago', type: 'request', status: 'Fulfilled' },
                            { action: 'KYC verification approved', time: '3 days ago', type: 'kyc', status: 'Approved' },
                            { action: 'Shared LPG with Amit K.', time: '5 days ago', type: 'share', status: 'Completed' },
                            { action: 'Account created', time: '1 week ago', type: 'account', status: 'Done' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-xl hover:bg-surface-container-low transition-colors">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.type === 'share' ? 'bg-secondary/10 text-secondary' :
                                        item.type === 'request' ? 'bg-primary/10 text-primary' :
                                            item.type === 'kyc' ? 'bg-secondary/10 text-secondary' :
                                                'bg-surface-container-high text-on-surface-variant'
                                    }`}>
                                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                                        {item.type === 'share' ? 'handshake' :
                                            item.type === 'request' ? 'emergency_share' :
                                                item.type === 'kyc' ? 'badge' :
                                                    'person_add'}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-on-surface text-sm">{item.action}</p>
                                    <p className="text-xs text-on-surface-variant">{item.time}</p>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-surface-container-high text-on-surface-variant px-2 py-1 rounded">
                                    {item.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sign Out */}
                <Link to="/login" className="block">
                    <button className="w-full h-14 rounded-xl border-2 border-outline-variant/30 text-on-surface-variant font-bold text-lg active:scale-95 transition-all flex items-center justify-center gap-3 hover:bg-surface-container-low">
                        <span className="material-symbols-outlined">logout</span>
                        Sign Out
                    </button>
                </Link>
            </main>
        </CitizenLayout>
    );
};

export default ProfilePage;
