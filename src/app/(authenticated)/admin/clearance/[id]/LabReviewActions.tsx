'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { approveLabClearance, rejectLabClearance } from '@/app/actions/certificate';
import { LAB_NAMES } from '@/types/clearance';

interface LabReviewActionsProps {
    requestId: string;
    labSchema: 'lab1' | 'lab2' | 'lab3' | 'lab4' | 'lab5';
    currentStatus: string;
    hasIssues: boolean;
}

export function LabReviewActions({
    requestId,
    labSchema,
    currentStatus,
    hasIssues
}: LabReviewActionsProps) {
    const router = useRouter();
    const [isApproving, setIsApproving] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [rejectionNotes, setRejectionNotes] = useState('');
    const [approvalNotes, setApprovalNotes] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleApprove = async () => {
        setIsApproving(true);
        setError(null);

        try {
            const result = await approveLabClearance(requestId, labSchema, approvalNotes || undefined);

            if (result.error) {
                setError(result.error);
            } else {
                router.refresh();
            }
        } catch (err) {
            setError('Failed to approve clearance');
        } finally {
            setIsApproving(false);
        }
    };

    const handleReject = async () => {
        if (!rejectionNotes.trim()) {
            setError('Please provide rejection notes');
            return;
        }

        setIsRejecting(true);
        setError(null);

        try {
            const result = await rejectLabClearance(requestId, labSchema, rejectionNotes);

            if (result.error) {
                setError(result.error);
            } else {
                setShowRejectForm(false);
                router.refresh();
            }
        } catch (err) {
            setError('Failed to reject clearance');
        } finally {
            setIsRejecting(false);
        }
    };

    if (currentStatus === 'cleared') {
        return (
            <div className="text-green-600 text-sm font-medium">
                ✓ Already cleared
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {error && (
                <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    {error}
                </div>
            )}

            {hasIssues && (
                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
                    ⚠️ This student has outstanding items in {LAB_NAMES[labSchema]}
                </div>
            )}

            {!showRejectForm ? (
                <div className="flex gap-2">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Approval notes (optional)"
                            value={approvalNotes}
                            onChange={(e) => setApprovalNotes(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                    </div>
                    <button
                        onClick={handleApprove}
                        disabled={isApproving}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
                    >
                        {isApproving ? 'Approving...' : 'Approve'}
                    </button>
                    <button
                        onClick={() => setShowRejectForm(true)}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                    >
                        Reject
                    </button>
                </div>
            ) : (
                <div className="space-y-2">
                    <textarea
                        placeholder="Rejection reason (required)"
                        value={rejectionNotes}
                        onChange={(e) => setRejectionNotes(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                setShowRejectForm(false);
                                setRejectionNotes('');
                                setError(null);
                            }}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleReject}
                            disabled={isRejecting || !rejectionNotes.trim()}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 text-sm"
                        >
                            {isRejecting ? 'Rejecting...' : 'Confirm Reject'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
