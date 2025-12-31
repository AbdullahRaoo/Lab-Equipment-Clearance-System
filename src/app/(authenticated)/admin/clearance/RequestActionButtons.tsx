'use client';

import { useState } from 'react';
import { updateRequestStatus } from '@/app/actions/borrow';

export function RequestActionButtons({ requestId }: { requestId: string }) {
    const [loading, setLoading] = useState(false);

    const handleAction = async (status: 'approved' | 'rejected') => {
        if (!confirm(`Are you sure you want to ${status} this request?`)) return;

        // If rejected, ask for reason
        let notes = '';
        if (status === 'rejected') {
            const reason = prompt("Enter rejection reason:");
            if (!reason) return; // Cancel if no reason
            notes = reason;
        }

        setLoading(true);
        await updateRequestStatus(requestId, status, notes);
        setLoading(false);
        // Revalidation handled in server action, router refresh might be needed if using client router cache, 
        // but revalidatePath usually works. 
    };

    return (
        <div className="flex gap-2">
            <button
                onClick={() => handleAction('approved')}
                disabled={loading}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
            >
                Approve
            </button>
            <button
                onClick={() => handleAction('rejected')}
                disabled={loading}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
            >
                Reject
            </button>
        </div>
    );
}
