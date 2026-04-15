import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import CitizenLayout from '../layouts/CitizenLayout';

const KYCPage: React.FC = () => {
    const [aadharFile, setAadharFile] = useState<File | null>(null);
    const [panFile, setPanFile] = useState<File | null>(null);
    const [selfieData, setSelfieData] = useState<string | null>(null);
    const [cameraActive, setCameraActive] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setCameraActive(true);
            }
        } catch (err) {
            console.error('Camera access denied', err);
        }
    };

    const captureSelfie = () => {
        if (videoRef.current && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            ctx?.drawImage(videoRef.current, 0, 0);
            const dataUrl = canvasRef.current.toDataURL('image/jpeg');
            setSelfieData(dataUrl);

            const stream = videoRef.current.srcObject as MediaStream;
            stream?.getTracks().forEach(t => t.stop());
            setCameraActive(false);
        }
    };

    const allUploaded = aadharFile && panFile && selfieData;

    return (
        <CitizenLayout activeTab="profile">
            <main className="pt-24 pb-32 px-6 max-w-2xl mx-auto min-h-screen">
                {/* Trust Header */}
                <div className="mb-8">
                    <span className="text-secondary font-semibold text-xs tracking-wider uppercase mb-2 block">Government Oversight Active</span>
                    <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">KYC Verification</h1>
                    <p className="text-on-surface-variant mt-2">Complete your identity verification to access all features.</p>
                </div>

                {/* Status Banner */}
                <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-xl p-4 mb-8 flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#F59E0B]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                    <div>
                        <p className="font-bold text-on-surface text-sm">KYC Pending</p>
                        <p className="text-xs text-on-surface-variant">Please upload required documents to get verified.</p>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Aadhar Upload */}
                    <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0px_10px_30px_rgba(25,28,30,0.06)]">
                        <label className="block text-xs font-bold text-on-surface-variant tracking-wider uppercase mb-4">Aadhar Card</label>
                        <label className="flex flex-col items-center justify-center border-2 border-dashed border-outline-variant/40 rounded-xl p-8 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all">
                            {aadharFile ? (
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-secondary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                    <span className="font-semibold text-on-surface text-sm">{aadharFile.name}</span>
                                </div>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-4xl text-outline/40 mb-3">upload_file</span>
                                    <p className="font-semibold text-on-surface text-sm">Upload Aadhar Card</p>
                                    <p className="text-xs text-on-surface-variant mt-1">Click to browse or drag & drop</p>
                                </>
                            )}
                            <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setAadharFile(e.target.files?.[0] || null)} />
                        </label>
                    </div>

                    {/* PAN Upload */}
                    <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0px_10px_30px_rgba(25,28,30,0.06)]">
                        <label className="block text-xs font-bold text-on-surface-variant tracking-wider uppercase mb-4">PAN Card</label>
                        <label className="flex flex-col items-center justify-center border-2 border-dashed border-outline-variant/40 rounded-xl p-8 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all">
                            {panFile ? (
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-secondary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                                    <span className="font-semibold text-on-surface text-sm">{panFile.name}</span>
                                </div>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-4xl text-outline/40 mb-3">upload_file</span>
                                    <p className="font-semibold text-on-surface text-sm">Upload PAN Card</p>
                                    <p className="text-xs text-on-surface-variant mt-1">Click to browse or drag & drop</p>
                                </>
                            )}
                            <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setPanFile(e.target.files?.[0] || null)} />
                        </label>
                    </div>

                    {/* Selfie Capture (Camera Only) */}
                    <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0px_10px_30px_rgba(25,28,30,0.06)]">
                        <label className="block text-xs font-bold text-on-surface-variant tracking-wider uppercase mb-4">Live Selfie</label>
                        {selfieData ? (
                            <div className="relative rounded-xl overflow-hidden">
                                <img src={selfieData} alt="Selfie" className="w-full rounded-xl" />
                                <button onClick={() => setSelfieData(null)} className="absolute top-3 right-3 bg-white/90 backdrop-blur p-2 rounded-full shadow-sm">
                                    <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                            </div>
                        ) : cameraActive ? (
                            <div className="relative rounded-xl overflow-hidden">
                                <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl" />
                                <button
                                    onClick={captureSelfie}
                                    className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-primary active:scale-90 transition-transform"
                                >
                                    <div className="w-12 h-12 rounded-full bg-primary"></div>
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={startCamera}
                                className="flex flex-col items-center justify-center border-2 border-dashed border-outline-variant/40 rounded-xl p-8 w-full hover:border-primary/40 hover:bg-primary/5 transition-all"
                            >
                                <span className="material-symbols-outlined text-4xl text-outline/40 mb-3">photo_camera</span>
                                <p className="font-semibold text-on-surface text-sm">Capture Live Selfie</p>
                                <p className="text-xs text-on-surface-variant mt-1">File upload is not allowed — camera only</p>
                            </button>
                        )}
                        <canvas ref={canvasRef} className="hidden" />
                    </div>

                    {/* Security Notice */}
                    <div className="flex items-start gap-3 p-4 bg-secondary-container/10 rounded-xl">
                        <span className="material-symbols-outlined text-secondary mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                        <p className="text-sm text-on-surface-variant leading-relaxed">
                            Your data is encrypted and only visible to your regional government Warden. We follow strict data protection policies.
                        </p>
                    </div>

                    {/* Submit */}
                    <button
                        disabled={!allUploaded}
                        className={`w-full h-14 rounded-xl font-bold text-lg transition-all duration-200 flex items-center justify-center gap-3 ${allUploaded
                                ? 'primary-gradient text-on-primary shadow-lg hover:opacity-90 active:scale-95'
                                : 'bg-surface-container-high text-outline cursor-not-allowed'
                            }`}
                    >
                        Submit for Verification
                        <span className="material-symbols-outlined">send</span>
                    </button>
                </div>
            </main>
        </CitizenLayout>
    );
};

export default KYCPage;
