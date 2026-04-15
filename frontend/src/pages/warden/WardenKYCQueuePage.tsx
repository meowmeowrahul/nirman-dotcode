import React, { useState } from 'react';
import WardenLayout from '../../layouts/WardenLayout';

interface KYCEntry {
    id: string;
    name: string;
    email: string;
    region: string;
    submittedAt: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

const mockData: KYCEntry[] = [
    { id: 'CIT-001', name: 'Ananya Patil', email: 'ananya@mail.com', region: 'Sector 3', submittedAt: '2 hours ago', status: 'PENDING' },
    { id: 'CIT-002', name: 'Rajesh Kumar', email: 'raj.k@mail.com', region: 'Sector 7', submittedAt: '5 hours ago', status: 'PENDING' },
    { id: 'CIT-003', name: 'Sneha Joshi', email: 'sneha.j@mail.com', region: 'Sector 1', submittedAt: '8 hours ago', status: 'PENDING' },
    { id: 'CIT-004', name: 'Vikram Desai', email: 'vikram.d@mail.com', region: 'Sector 4', submittedAt: '1 day ago', status: 'PENDING' },
    { id: 'CIT-005', name: 'Priya Mehta', email: 'priya.m@mail.com', region: 'Sector 2', submittedAt: '1 day ago', status: 'PENDING' },
];

const WardenKYCQueuePage: React.FC = () => {
    const [entries, setEntries] = useState(mockData);
    const [selected, setSelected] = useState<KYCEntry | null>(null);

    const handleApprove = (id: string) => {
        setEntries(prev => prev.map(e => e.id === id ? { ...e, status: 'APPROVED' as const } : e));
        setSelected(null);
    };

    const handleReject = (id: string) => {
        setEntries(prev => prev.map(e => e.id === id ? { ...e, status: 'REJECTED' as const } : e));
        setSelected(null);
    };

    return (
        <WardenLayout>
            <div className="px-6 lg:px-10 max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">KYC Verification Queue</h1>
                        <p className="text-on-surface-variant mt-2">{entries.filter(e => e.status === 'PENDING').length} citizens awaiting verification.</p>
                    </div>
                    <div className="flex items-center gap-2 bg-[#F59E0B]/10 px-4 py-2 rounded-full">
                        <span className="material-symbols-outlined text-[#F59E0B]" style={{ fontVariationSettings: "'FILL' 1" }}>pending</span>
                        <span className="text-sm font-bold text-on-surface">{entries.filter(e => e.status === 'PENDING').length} Pending</span>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-surface-container-lowest rounded-xl shadow-[0px_10px_30px_rgba(25,28,30,0.06)] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-surface-container-low">
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-on-surface-variant px-6 py-4">Citizen ID</th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-on-surface-variant px-6 py-4">Name</th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-on-surface-variant px-6 py-4 hidden md:table-cell">Region</th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-on-surface-variant px-6 py-4 hidden md:table-cell">Submitted</th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-on-surface-variant px-6 py-4">Status</th>
                                    <th className="text-right text-[10px] font-bold uppercase tracking-wider text-on-surface-variant px-6 py-4">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entries.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-surface-container-low/50 transition-colors border-t border-outline-variant/10">
                                        <td className="px-6 py-4 text-sm font-medium text-on-surface">{entry.id}</td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-semibold text-on-surface">{entry.name}</p>
                                            <p className="text-xs text-on-surface-variant">{entry.email}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-on-surface-variant hidden md:table-cell">{entry.region}</td>
                                        <td className="px-6 py-4 text-sm text-on-surface-variant hidden md:table-cell">{entry.submittedAt}</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${entry.status === 'PENDING' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' :
                                                    entry.status === 'APPROVED' ? 'bg-secondary-container text-on-secondary-container' :
                                                        'bg-error-container text-on-error-container'
                                                }`}>
                                                {entry.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {entry.status === 'PENDING' && (
                                                <button
                                                    onClick={() => setSelected(entry)}
                                                    className="text-primary font-semibold text-sm hover:underline"
                                                >
                                                    Review
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            {selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-inverse-surface/50 glass-effect" onClick={() => setSelected(null)} />
                    <div className="relative bg-surface-container-lowest rounded-xl w-full max-w-lg p-8 shadow-2xl">
                        <button onClick={() => setSelected(null)} className="absolute top-4 right-4 text-outline hover:text-on-surface transition-colors">
                            <span className="material-symbols-outlined">close</span>
                        </button>

                        <h3 className="text-xl font-bold text-on-surface mb-1">{selected.name}</h3>
                        <p className="text-sm text-on-surface-variant mb-6">{selected.id} • {selected.region}</p>

                        {/* Document Previews */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-surface-container-low rounded-xl p-4 text-center">
                                <span className="material-symbols-outlined text-3xl text-outline/40 mb-2">credit_card</span>
                                <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Aadhar Card</p>
                                <p className="text-[10px] text-outline mt-1">Encrypted Document</p>
                            </div>
                            <div className="bg-surface-container-low rounded-xl p-4 text-center">
                                <span className="material-symbols-outlined text-3xl text-outline/40 mb-2">credit_card</span>
                                <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">PAN Card</p>
                                <p className="text-[10px] text-outline mt-1">Encrypted Document</p>
                            </div>
                        </div>

                        {/* Selfie */}
                        <div className="bg-surface-container-low rounded-xl p-4 text-center mb-8">
                            <span className="material-symbols-outlined text-3xl text-outline/40 mb-2">photo_camera</span>
                            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Live Selfie</p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => handleApprove(selected.id)}
                                className="flex-1 h-14 rounded-xl bg-secondary text-on-secondary font-bold text-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined">check</span>
                                Approve KYC
                            </button>
                            <button
                                onClick={() => handleReject(selected.id)}
                                className="flex-1 h-14 rounded-xl bg-error text-on-error font-bold text-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined">flag</span>
                                Reject & Flag
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </WardenLayout>
    );
};

export default WardenKYCQueuePage;
