import React, { useState } from 'react';
import WardenLayout from '../../layouts/WardenLayout';

interface AuditEntry {
    id: string;
    dateTime: string;
    lenderId: string;
    tenantId: string;
    aiLog: string;
    exchangePin: string;
    flagged: boolean;
}

const mockAuditData: AuditEntry[] = [
    { id: 'TXN-0041', dateTime: '2024-03-15 14:23', lenderId: 'CIT-087', tenantId: 'CIT-143', aiLog: 'Expiry: B-26, Seal: Intact', exchangePin: '7294', flagged: false },
    { id: 'TXN-0040', dateTime: '2024-03-15 12:05', lenderId: 'CIT-032', tenantId: 'CIT-291', aiLog: 'Expiry: A-27, Seal: Intact', exchangePin: '3851', flagged: false },
    { id: 'TXN-0039', dateTime: '2024-03-15 09:47', lenderId: 'CIT-032', tenantId: 'CIT-078', aiLog: 'Expiry: C-25, Seal: Intact', exchangePin: '6102', flagged: true },
    { id: 'TXN-0038', dateTime: '2024-03-14 18:31', lenderId: 'CIT-195', tenantId: 'CIT-054', aiLog: 'Expiry: B-26, Seal: Intact', exchangePin: '9473', flagged: false },
    { id: 'TXN-0037', dateTime: '2024-03-14 15:12', lenderId: 'CIT-112', tenantId: 'CIT-320', aiLog: 'Expiry: A-27, Seal: Minor wear', exchangePin: '2846', flagged: false },
    { id: 'TXN-0036', dateTime: '2024-03-14 11:44', lenderId: 'CIT-032', tenantId: 'CIT-167', aiLog: 'Expiry: B-26, Seal: Intact', exchangePin: '5139', flagged: true },
];

const AuditLogPage: React.FC = () => {
    const [entries, setEntries] = useState(mockAuditData);

    const toggleFlag = (id: string) => {
        setEntries(prev => prev.map(e => e.id === id ? { ...e, flagged: !e.flagged } : e));
    };

    return (
        <WardenLayout>
            <div className="px-6 lg:px-10 max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">Immutable Audit Log</h1>
                        <p className="text-on-surface-variant mt-2">Secure, uneditable ledger of all completed transactions.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-surface-container-high px-4 py-2 rounded-full">
                            <span className="material-symbols-outlined text-on-surface-variant text-sm">lock</span>
                            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Tamper-Proof</span>
                        </div>
                        {entries.filter(e => e.flagged).length > 0 && (
                            <div className="flex items-center gap-2 bg-[#F59E0B]/10 px-4 py-2 rounded-full">
                                <span className="material-symbols-outlined text-[#F59E0B] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>flag</span>
                                <span className="text-xs font-bold text-[#F59E0B]">{entries.filter(e => e.flagged).length} Flagged</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Audit Table */}
                <div className="bg-surface-container-lowest rounded-xl shadow-[0px_10px_30px_rgba(25,28,30,0.06)] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-surface-container-low">
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-on-surface-variant px-6 py-4">ID</th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-on-surface-variant px-6 py-4">Date/Time</th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-on-surface-variant px-6 py-4">Lender</th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-on-surface-variant px-6 py-4">Tenant</th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-on-surface-variant px-6 py-4 hidden lg:table-cell">AI Vision Log</th>
                                    <th className="text-left text-[10px] font-bold uppercase tracking-wider text-on-surface-variant px-6 py-4 hidden md:table-cell">PIN</th>
                                    <th className="text-right text-[10px] font-bold uppercase tracking-wider text-on-surface-variant px-6 py-4">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entries.map((entry) => (
                                    <tr
                                        key={entry.id}
                                        className={`hover:bg-surface-container-low/50 transition-colors border-t border-outline-variant/10 ${entry.flagged ? 'bg-[#F59E0B]/5' : ''
                                            }`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {entry.flagged && <span className="material-symbols-outlined text-[#F59E0B] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>flag</span>}
                                                <span className="text-sm font-medium text-on-surface">{entry.id}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-on-surface-variant">{entry.dateTime}</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-sm font-semibold ${entries.filter(e => e.lenderId === entry.lenderId).length > 2 ? 'text-[#F59E0B]' : 'text-on-surface'
                                                }`}>{entry.lenderId}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-on-surface">{entry.tenantId}</td>
                                        <td className="px-6 py-4 text-sm text-on-surface-variant hidden lg:table-cell">
                                            <span className="bg-surface-container-high px-2 py-1 rounded text-xs font-mono">{entry.aiLog}</span>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <span className="bg-surface-container-low text-on-surface text-xs font-mono font-bold px-2 py-1 rounded">{entry.exchangePin}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => toggleFlag(entry.id)}
                                                className={`text-sm font-semibold transition-colors flex items-center gap-1 ml-auto ${entry.flagged ? 'text-[#F59E0B]' : 'text-outline hover:text-[#F59E0B]'
                                                    }`}
                                            >
                                                <span className="material-symbols-outlined text-sm" style={entry.flagged ? { fontVariationSettings: "'FILL' 1" } : undefined}>flag</span>
                                                {entry.flagged ? 'Flagged' : 'Flag'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Suspicious Activity Notice */}
                {entries.filter(e => e.flagged).length > 0 && (
                    <div className="bg-[#F59E0B]/5 border border-[#F59E0B]/20 rounded-xl p-6 flex items-start gap-4">
                        <span className="material-symbols-outlined text-[#F59E0B] text-xl mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                        <div>
                            <p className="font-bold text-on-surface text-sm">Suspicious Activity Detected</p>
                            <p className="text-xs text-on-surface-variant mt-1">
                                Citizen CIT-032 has been flagged for repeated lending (3 transactions). This pattern may indicate potential black-market activity. Review recommended.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </WardenLayout>
    );
};

export default AuditLogPage;
