import React from 'react';
import { Link } from 'react-router-dom';
import CitizenLayout from '../layouts/CitizenLayout';

const EmergencyRequestPage: React.FC = () => {
    return (
        <CitizenLayout activeTab="requests">
            <main className="pt-24 pb-32 px-6 max-w-4xl mx-auto min-h-screen">
                {/* Trust Header */}
                <div className="mb-10 text-center">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-secondary mb-2">Government Oversight Active</p>
                    <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">Request Help Now</h2>
                </div>

                {/* Asymmetric Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Input Canvas */}
                    <section className="lg:col-span-7 space-y-8">
                        <div className="bg-surface-container-lowest rounded-xl p-8 shadow-[0px_10px_30px_rgba(25,28,30,0.06)]">
                            <label className="block text-sm font-semibold text-on-surface-variant mb-4" htmlFor="situation">
                                DESCRIBE YOUR SITUATION
                            </label>
                            <textarea
                                id="situation"
                                className="w-full min-h-[240px] bg-surface-container-low border-none rounded-xl p-6 text-xl leading-relaxed text-on-surface focus:ring-2 focus:ring-primary/40 placeholder:text-outline-variant/60 resize-none transition-all"
                                placeholder="Describe your situation..."
                            />
                            <div className="mt-8 flex items-center justify-between">
                                <p className="text-sm text-outline font-medium">Text will be analyzed by SahayAI</p>
                                <button className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-lg active:scale-90 transition-transform duration-200">
                                    <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>mic</span>
                                </button>
                            </div>
                        </div>

                        {/* AI State Skeleton Loaders */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-6 h-6 rounded-full skeleton-pulse"></div>
                                <p className="text-on-surface-variant font-medium text-sm">AI is analyzing urgency...</p>
                            </div>
                            <div className="w-full h-3 rounded-full skeleton-pulse"></div>
                            <div className="w-4/5 h-3 rounded-full skeleton-pulse"></div>
                        </div>
                    </section>

                    {/* Match Radar */}
                    <aside className="lg:col-span-5">
                        <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0px_10px_30px_rgba(25,28,30,0.06)] h-full min-h-[400px] relative">
                            {/* Map Background */}
                            <div className="absolute inset-0 z-0">
                                <div className="w-full h-full bg-gradient-to-br from-surface-container-low via-surface-container to-surface-container-high opacity-60"></div>
                                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent"></div>
                            </div>

                            {/* Radar Overlay */}
                            <div className="relative z-10 h-full flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
                                <div className="relative mb-8">
                                    {/* Central Point */}
                                    <div className="w-4 h-4 bg-primary rounded-full relative z-20"></div>
                                    {/* Pulsing Radar Waves */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-primary/30 rounded-full radar-pulse"></div>
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-primary/20 rounded-full radar-pulse" style={{ animationDelay: '0.5s' }}></div>
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 border-2 border-primary/10 rounded-full radar-pulse" style={{ animationDelay: '1s' }}></div>
                                </div>

                                <div className="mt-auto">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold tracking-wider uppercase mb-4">
                                        500m Radius Active
                                    </span>
                                    <p className="text-lg font-bold text-on-surface mb-2">Searching nearby neighbors</p>
                                    <p className="text-sm text-on-surface-variant leading-relaxed px-4">
                                        Our algorithm is matching your request with 14 verified providers within walking distance.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>

                {/* Final Action */}
                <div className="mt-12 flex flex-col items-center gap-6">
                    <button className="w-full md:w-[400px] h-14 rounded-xl bg-gradient-to-b from-primary to-primary-container text-on-primary font-bold text-lg shadow-lg hover:opacity-90 active:scale-95 duration-200 transition-all flex items-center justify-center gap-3">
                        Broadcast Request
                        <span className="material-symbols-outlined">send</span>
                    </button>
                    <Link to="/dashboard" className="text-tertiary font-semibold hover:underline px-6 py-2">
                        Cancel Request
                    </Link>
                </div>
            </main>
        </CitizenLayout>
    );
};

export default EmergencyRequestPage;
