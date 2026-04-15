import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import CitizenLayout from '../layouts/CitizenLayout';

type VerificationState = 'idle' | 'scanning' | 'success' | 'rejected';

const LendPage: React.FC = () => {
    const [step, setStep] = useState(1);
    const [verificationState, setVerificationState] = useState<VerificationState>('idle');

    const simulateScan = () => {
        setVerificationState('scanning');
        setTimeout(() => {
            setVerificationState('success');
        }, 3000);
    };

    return (
        <CitizenLayout activeTab="home">
            <main className="pt-24 pb-32 px-6 max-w-3xl mx-auto min-h-screen">
                {/* Header */}
                <div className="mb-8">
                    <span className="text-secondary font-semibold text-xs tracking-wider uppercase mb-2 block">Government Oversight Active</span>
                    <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">List Your LPG</h1>
                    <p className="text-on-surface-variant mt-2">Help a neighbor by sharing your extra cylinder.</p>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center gap-3 mb-10">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= s ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-outline'
                                }`}>
                                {step > s ? (
                                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                                ) : s}
                            </div>
                            {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-primary' : 'bg-surface-container-high'}`} />}
                        </div>
                    ))}
                </div>

                {/* Step 1: Cylinder Scan */}
                {step === 1 && (
                    <div className="space-y-8">
                        <div className="bg-surface-container-lowest rounded-xl p-8 shadow-[0px_10px_30px_rgba(25,28,30,0.06)]">
                            <h3 className="text-lg font-bold mb-2">Scan Your Cylinder</h3>
                            <p className="text-sm text-on-surface-variant mb-6">Position the cylinder so the expiry ring and valve seal are visible.</p>

                            {/* Camera Viewport */}
                            <div className="relative bg-inverse-surface rounded-xl overflow-hidden aspect-[4/3] flex items-center justify-center">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-64 h-80 border-2 border-dashed border-white/40 rounded-xl flex flex-col items-center justify-center">
                                        <span className="material-symbols-outlined text-white/60 text-5xl mb-3">propane_tank</span>
                                        <p className="text-white/60 text-xs font-medium">Align cylinder here</p>
                                    </div>
                                </div>
                                {/* Guidance overlay text */}
                                <div className="absolute bottom-4 left-4 right-4 flex justify-between">
                                    <span className="bg-white/20 backdrop-blur text-white text-[10px] font-bold py-1 px-3 rounded-full">Expiry Ring ↑</span>
                                    <span className="bg-white/20 backdrop-blur text-white text-[10px] font-bold py-1 px-3 rounded-full">Valve Seal →</span>
                                </div>
                            </div>

                            <button
                                onClick={simulateScan}
                                className="w-full h-14 rounded-xl primary-gradient text-on-primary font-bold text-lg shadow-lg mt-6 active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>photo_camera</span>
                                Capture & Analyze
                            </button>
                        </div>

                        {/* AI Verification States */}
                        {verificationState === 'scanning' && (
                            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0px_10px_30px_rgba(25,28,30,0.06)]">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                                    <p className="text-on-surface font-semibold">Analyzing cylinder safety and expiry...</p>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full skeleton-pulse" />
                                        <p className="text-sm text-on-surface-variant">Reading expiry code...</p>
                                    </div>
                                    <div className="w-full h-2 rounded-full skeleton-pulse" />
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full skeleton-pulse" />
                                        <p className="text-sm text-on-surface-variant">Checking valve seal integrity...</p>
                                    </div>
                                    <div className="w-3/4 h-2 rounded-full skeleton-pulse" />
                                </div>
                            </div>
                        )}

                        {verificationState === 'success' && (
                            <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="material-symbols-outlined text-secondary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                    <p className="text-on-surface font-bold">Cylinder Verified</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-surface-container-lowest rounded-xl p-4">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">Expiry</p>
                                        <p className="text-lg font-bold text-on-surface">B-26</p>
                                    </div>
                                    <div className="bg-surface-container-lowest rounded-xl p-4">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">Seal</p>
                                        <p className="text-lg font-bold text-secondary">Intact</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setStep(2)}
                                    className="w-full h-14 rounded-xl bg-secondary text-on-secondary font-bold text-lg shadow-lg mt-6 active:scale-95 transition-all"
                                >
                                    Continue to Details
                                </button>
                            </div>
                        )}

                        {verificationState === 'rejected' && (
                            <div className="bg-error/5 border border-error/20 rounded-xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="material-symbols-outlined text-error text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
                                    <p className="text-on-surface font-bold">Cylinder Rejected</p>
                                </div>
                                <p className="text-sm text-on-surface-variant">AI has flagged this cylinder as expired or tampered. Submission is blocked for safety.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 2: Listing Details */}
                {step === 2 && (
                    <div className="bg-surface-container-lowest rounded-xl p-8 shadow-[0px_10px_30px_rgba(25,28,30,0.06)] space-y-6">
                        <h3 className="text-lg font-bold">Listing Details</h3>
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-on-surface-variant tracking-wider uppercase">Availability Window</label>
                            <select className="w-full h-[56px] bg-surface-container-low border-none rounded-xl px-4 text-on-surface focus:ring-2 focus:ring-primary/40">
                                <option>Available Now</option>
                                <option>Next 2 Hours</option>
                                <option>Next 6 Hours</option>
                                <option>Tomorrow</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-on-surface-variant tracking-wider uppercase">Additional Notes</label>
                            <textarea
                                className="w-full min-h-[120px] bg-surface-container-low border-none rounded-xl p-4 text-on-surface focus:ring-2 focus:ring-primary/40 placeholder:text-outline resize-none"
                                placeholder="Any special instructions for pickup..."
                            />
                        </div>
                        <button
                            onClick={() => setStep(3)}
                            className="w-full h-14 rounded-xl primary-gradient text-on-primary font-bold text-lg shadow-lg active:scale-95 transition-all"
                        >
                            Publish Listing
                        </button>
                    </div>
                )}

                {/* Step 3: Confirmation */}
                {step === 3 && (
                    <div className="bg-surface-container-lowest rounded-xl p-8 shadow-[0px_10px_30px_rgba(25,28,30,0.06)] text-center space-y-6">
                        <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto">
                            <span className="material-symbols-outlined text-secondary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        </div>
                        <h3 className="text-2xl font-extrabold text-on-surface">Listing Published!</h3>
                        <p className="text-on-surface-variant max-w-sm mx-auto">Your LPG cylinder is now visible to neighbors in your area. You'll be notified when someone requests it.</p>
                        <div className="bg-surface-container-low rounded-xl p-4 inline-flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary">schedule</span>
                            <span className="text-sm font-medium text-on-surface">Estimated match time: 15-30 mins</span>
                        </div>
                        <Link to="/dashboard" className="block">
                            <button className="w-full h-14 rounded-xl bg-secondary text-on-secondary font-bold text-lg shadow-lg active:scale-95 transition-all">
                                Return to Dashboard
                            </button>
                        </Link>
                    </div>
                )}
            </main>
        </CitizenLayout>
    );
};

export default LendPage;
