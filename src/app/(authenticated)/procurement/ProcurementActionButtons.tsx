'use client';

import { useState } from 'react';
import { updateProcurementStatus } from '@/app/actions/procurement';

export function ProcurementActionButtons({ requestId }: { requestId: string }) {
    const [loading, setLoading] = useState(false);

    const handleAction = async (status: 'approved' | 'rejected') => {
        const reason = status === 'rejected' ? prompt("Enter rejection reason:") : null;
        if (status === 'rejected' && !reason) return;

        setLoading(true);
        await updateProcurementStatus(requestId, status, reason || undefined);
        setLoading(false);
    };

    return (
        <div className="flex gap-2">
            <button
                onClick={() => handleAction('approved')}
                disabled={loading}
                className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 border border-green-300 disabled:opacity-50"
            >
                Approve
            </button>
            <button
                onClick={() => handleAction('rejected')}
                disabled={loading}
                className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 border border-red-300 disabled:opacity-50"
            >
                Reject
            </button>
        </div>
    );
}
