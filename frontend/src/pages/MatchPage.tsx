import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import CitizenLayout from '../layouts/CitizenLayout';

const MatchPage: React.FC = () => {
    const [view, setView] = useState<'tenant' | 'lender'>('tenant');
    const [accepted, setAccepted] = useState(false);

    const exchangeCode = '7294';

    return (
        <CitizenLayout activeTab="requests">
            <main className="pt-24 pb-32 px-6 max-w-3xl mx-auto min-h-screen">
                {/* Header */}
                <div className="mb-8 text-center">
                    <span className="text-secondary font-semibold text-xs tracking-wider uppercase mb-2 block">Government Oversight Active</span>
                    <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">Match & Exchange</h1>
                </div>

                {/* View Toggle */}
                <div className="bg-surface-container-low p-1.5 rounded-xl flex mb-8 max-w-sm mx-auto">
                    <button
                        onClick={() => setView('tenant')}
                        className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all duration-200 ${view === 'tenant' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'
                            }`}
                    >
                        Your Request
                    </button>
                    <button
                        onClick={() => setView('lender')}
                        className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all duration-200 ${view === 'lender' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'
                            }`}
                    >
                        Incoming Request
                    </button>
                </div>

                {/* Tenant View */}
                {view === 'tenant' && (
                    <div className="space-y-6">
                        <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-8 text-center">
                            <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-secondary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_people</span>
                            </div>
                            <h3 className="text-xl font-bold text-on-surface mb-2">Match Found!</h3>
                            <p className="text-on-surface-variant">
                                <span className="font-bold text-on-surface">Ravi</span> (300m away) has accepted your request.
                            </p>
                        </div>

                        {/* Exchange Code */}
                        <div className="bg-surface-container-lowest rounded-xl p-8 shadow-[0px_10px_30px_rgba(25,28,30,0.06)] text-center">
                            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-4">Exchange Verification Code</p>
                            <div className="flex justify-center gap-3 mb-4">
                                {exchangeCode.split('').map((digit, i) => (
                                    <div key={i} className="w-16 h-20 bg-surface-container-low rounded-xl flex items-center justify-center">
                                        <span className="text-3xl font-black text-on-surface">{digit}</span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-sm text-on-surface-variant">Share this code with the lender during physical handover to verify the exchange.</p>
                        </div>

                        {/* Lender Profile Card */}
                        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0px_10px_30px_rgba(25,28,30,0.06)]">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-primary-fixed flex items-center justify-center">
                                    <span className="material-symbols-outlined text-on-primary-fixed-variant text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-on-surface">Ravi Sharma</p>
                                    <p className="text-sm text-on-surface-variant">300m away • Sector 4, Kothrud</p>
                                </div>
                                <div className="flex items-center gap-1 bg-secondary-container/30 px-3 py-1.5 rounded-full">
                                    <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                                    <span className="text-xs font-bold text-on-secondary-container">Verified</span>
                                </div>
                            </div>
                            <div className="mt-4 grid grid-cols-3 gap-3">
                                <div className="bg-surface-container-low rounded-xl p-3 text-center">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Trust</p>
                                    <p className="text-lg font-black text-on-surface">890</p>
                                </div>
                                <div className="bg-surface-container-low rounded-xl p-3 text-center">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Shares</p>
                                    <p className="text-lg font-black text-on-surface">24</p>
                                </div>
                                <div className="bg-surface-container-low rounded-xl p-3 text-center">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Distance</p>
                                    <p className="text-lg font-black text-on-surface">300m</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Lender View */}
                {view === 'lender' && (
                    <div className="space-y-6">
                        {!accepted ? (
                            <div className="bg-tertiary-container/5 border border-tertiary-container/20 rounded-xl p-8">
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 rounded-full bg-tertiary-fixed flex items-center justify-center flex-shrink-0">
                                        <span className="material-symbols-outlined text-tertiary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-on-surface mb-2">Incoming Request!</h3>
                                        <p className="text-on-surface-variant leading-relaxed">
                                            A neighbor <span className="font-bold text-on-surface">300m away</span> needs gas for an infant. They have a verified trust score of 850.
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 flex gap-3">
                                    <button
                                        onClick={() => setAccepted(true)}
                                        className="flex-1 h-14 rounded-xl bg-secondary text-on-secondary font-bold text-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined">check</span>
                                        Accept
                                    </button>
                                    <button className="flex-1 h-14 rounded-xl border-2 border-outline-variant/30 text-on-surface-variant font-bold text-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                                        <span className="material-symbols-outlined">close</span>
                                        Decline
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-8 text-center">
                                    <span className="material-symbols-outlined text-secondary text-4xl mb-3" style={{ fontVariationSettings: "'FILL' 1" }}>handshake</span>
                                    <h3 className="text-xl font-bold text-on-surface mb-2">Request Accepted!</h3>
                                    <p className="text-on-surface-variant">Waiting for the requester to arrive for the exchange.</p>
                                </div>

                                <div className="bg-surface-container-lowest rounded-xl p-8 shadow-[0px_10px_30px_rgba(25,28,30,0.06)] text-center">
                                    <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-4">Ask for this code during handover</p>
                                    <div className="flex justify-center gap-3 mb-4">
                                        {exchangeCode.split('').map((digit, i) => (
                                            <div key={i} className="w-16 h-20 bg-surface-container-low rounded-xl flex items-center justify-center">
                                                <span className="text-3xl font-black text-on-surface">{digit}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </CitizenLayout>
    );
};

export default MatchPage;
