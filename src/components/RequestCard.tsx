'use client';

import { useState, useTransition } from 'react';
import { BorrowRequest, STATUS_COLORS, STATUS_LABELS, UserRole, ROLE_LABELS } from '@/types/clearance';
import { approveRequest, rejectRequest, markHandedOver, markReturned } from '@/app/actions/equipment-request';
import ApprovalTimeline from '@/components/ApprovalTimeline';

interface RequestCardProps {
    request: BorrowRequest;
    userRole: UserRole;
    showActions?: boolean;
    onUpdate?: () => void;
}

export default function RequestCard({ request, userRole, showActions = true, onUpdate }: RequestCardProps) {
    const [isPending, startTransition] = useTransition();
    const [showDetails, setShowDetails] = useState(false);
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const canApprove = canApproveThisRequest(userRole, request);
    const canHandover = ['lab_engineer', 'lab_assistant'].includes(userRole) && request.status === 'approved';
    const canMarkReturn = ['lab_engineer', 'lab_assistant'].includes(userRole) && request.status === 'handed_over';

    function canApproveThisRequest(role: UserRole, req: BorrowRequest): boolean {
        const stage = req.current_stage;
        switch (stage) {
            case 1:
                return ['lab_engineer', 'lab_assistant'].includes(role);
            case 2:
                // Check if this user's role hasn't approved yet
                if (role === 'oic_cen_labs' && !req.stage2_oic_approved_by) return true;
                if (role === 'asst_oic_cen_labs' && !req.stage2_asst_approved_by) return true;
                return false;
            case 3:
                return ['hod', 'pro_hod'].includes(role);
            default:
                return false;
        }
    }

    const handleApprove = async () => {
        startTransition(async () => {
            const result = await approveRequest(request.id);
            if (result.error) {
                setMessage({ type: 'error', text: result.error });
            } else {
                setMessage({ type: 'success', text: 'Request approved!' });
                onUpdate?.();
            }
        });
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            setMessage({ type: 'error', text: 'Please provide a rejection reason' });
            return;
        }
        startTransition(async () => {
            const result = await rejectRequest(request.id, rejectReason);
            if (result.error) {
                setMessage({ type: 'error', text: result.error });
            } else {
                setMessage({ type: 'success', text: 'Request rejected' });
                setShowRejectForm(false);
                onUpdate?.();
            }
        });
    };

    const handleHandover = async () => {
        startTransition(async () => {
            const result = await markHandedOver(request.id);
            if (result.error) {
                setMessage({ type: 'error', text: result.error });
            } else {
                setMessage({ type: 'success', text: 'Marked as handed over!' });
                onUpdate?.();
            }
        });
    };

    const handleReturn = async () => {
        startTransition(async () => {
            const result = await markReturned(request.id);
            if (result.error) {
                setMessage({ type: 'error', text: result.error });
            } else {
                setMessage({ type: 'success', text: 'Marked as returned!' });
                onUpdate?.();
            }
        });
    };

    const student = request.profiles as any;
    const lab = request.labs as any;
    const items = request.borrow_request_items || [];

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow">
            {/* Header */}
            <div className="p-5 border-b border-gray-100">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg">
                            {student?.full_name?.charAt(0) || '?'}
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">{student?.full_name || 'Unknown Student'}</h3>
                            <p className="text-sm text-gray-500">{student?.reg_no} • {student?.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[request.status] || 'bg-gray-100'}`}>
                            {STATUS_LABELS[request.status] || request.status}
                        </span>
                        {request.request_type === 'home' && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                Home Use
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
                {/* Lab & Purpose */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-gray-500 mb-1">Lab</p>
                        <p className="font-medium text-gray-900">{lab?.name || 'Unknown Lab'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 mb-1">Duration</p>
                        <p className="text-sm text-gray-700">
                            {new Date(request.start_time).toLocaleDateString()} - {new Date(request.end_time).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                <div>
                    <p className="text-xs text-gray-500 mb-1">Purpose</p>
                    <p className="text-sm text-gray-700">{request.purpose}</p>
                </div>

                {/* Items */}
                <div>
                    <p className="text-xs text-gray-500 mb-2">Requested Items ({items.length})</p>
                    <div className="flex flex-wrap gap-2">
                        {items.slice(0, 3).map((item: any, idx: number) => (
                            <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                                {item.inventory?.name || 'Item'}
                            </span>
                        ))}
                        {items.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-500">
                                +{items.length - 3} more
                            </span>
                        )}
                    </div>
                </div>

                {/* Message */}
                {message && (
                    <div className={`p-3 rounded-lg text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                        {message.text}
                    </div>
                )}

                {/* Toggle Details */}
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                    {showDetails ? 'Hide' : 'Show'} Timeline
                    <svg className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {showDetails && (
                    <div className="mt-4 pt-4 border-t">
                        <ApprovalTimeline request={request} />
                    </div>
                )}
            </div>

            {/* Actions */}
            {showActions && (canApprove || canHandover || canMarkReturn) && (
                <div className="px-5 py-4 bg-gray-50 border-t">
                    {showRejectForm ? (
                        <div className="space-y-3">
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Rejection reason (required)"
                                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                                rows={2}
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowRejectForm(false)}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReject}
                                    disabled={isPending}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                    {isPending ? 'Rejecting...' : 'Confirm Reject'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            {canApprove && (
                                <>
                                    <button
                                        onClick={handleApprove}
                                        disabled={isPending}
                                        className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        {isPending ? 'Processing...' : 'Approve'}
                                    </button>
                                    <button
                                        onClick={() => setShowRejectForm(true)}
                                        className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Reject
                                    </button>
                                </>
                            )}
                            {canHandover && (
                                <button
                                    onClick={handleHandover}
                                    disabled={isPending}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                    Mark Handed Over
                                </button>
                            )}
                            {canMarkReturn && (
                                <button
                                    onClick={handleReturn}
                                    disabled={isPending}
                                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Mark Returned
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
