'use client';

import { RequestStatus, STATUS_LABELS, STATUS_COLORS, BorrowRequest, Profile } from '@/types/clearance';

interface ApprovalTimelineProps {
    request: BorrowRequest;
}

interface TimelineStep {
    stage: number;
    label: string;
    description: string;
    status: 'completed' | 'current' | 'pending' | 'rejected';
    approver?: Profile | null;
    timestamp?: string | null;
    requiresBoth?: boolean;
    secondApprover?: Profile | null;
    secondTimestamp?: string | null;
}

export default function ApprovalTimeline({ request }: ApprovalTimelineProps) {
    const steps: TimelineStep[] = [
        {
            stage: 0,
            label: 'Submitted',
            description: 'Request submitted by student',
            status: 'completed',
            timestamp: request.created_at
        },
        {
            stage: 1,
            label: 'Lab Staff Review',
            description: 'Lab Engineer or Lab Assistant',
            status: getStepStatus(request, 1),
            approver: request.stage1_approver as Profile,
            timestamp: request.stage1_approved_at
        },
        {
            stage: 2,
            label: 'OIC Review',
            description: 'OIC CEN Labs & Asst. OIC CEN Labs',
            status: getStepStatus(request, 2),
            requiresBoth: true,
            approver: request.stage2_oic_approver as Profile,
            timestamp: request.stage2_oic_approved_at,
            secondApprover: request.stage2_asst_approver as Profile,
            secondTimestamp: request.stage2_asst_approved_at
        },
        {
            stage: 3,
            label: 'HOD Approval',
            description: 'HOD or Pro-HOD',
            status: getStepStatus(request, 3),
            approver: request.stage3_approver as Profile,
            timestamp: request.stage3_approved_at
        },
        {
            stage: 4,
            label: 'Ready for Pickup',
            description: 'Collect equipment from lab',
            status: request.status === 'approved' ? 'current' :
                request.status === 'handed_over' || request.status === 'returned' ? 'completed' : 'pending'
        },
        {
            stage: 5,
            label: 'Returned',
            description: 'Equipment returned to lab',
            status: request.status === 'returned' ? 'completed' :
                request.status === 'handed_over' ? 'current' : 'pending'
        }
    ];

    // Find rejection point if rejected
    const isRejected = request.status === 'rejected';

    function getStepStatus(req: BorrowRequest, stage: number): 'completed' | 'current' | 'pending' | 'rejected' {
        if (isRejected && req.rejection_stage === stage) return 'rejected';
        if (req.current_stage > stage) return 'completed';
        if (req.current_stage === stage) return 'current';
        return 'pending';
    }

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Approval Progress</h3>

            <div className="relative">
                {steps.map((step, index) => (
                    <div key={step.stage} className="relative flex gap-4 pb-8 last:pb-0">
                        {/* Connector Line */}
                        {index < steps.length - 1 && (
                            <div className="absolute left-[18px] top-10 w-0.5 h-[calc(100%-20px)] bg-gray-200">
                                <div
                                    className={`w-full transition-all duration-500 ${step.status === 'completed' ? 'bg-emerald-500 h-full' :
                                            step.status === 'rejected' ? 'bg-red-500 h-1/2' : 'h-0'
                                        }`}
                                />
                            </div>
                        )}

                        {/* Status Icon */}
                        <div className={`relative z-10 flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${step.status === 'completed' ? 'bg-emerald-500 text-white' :
                                step.status === 'current' ? 'bg-blue-500 text-white ring-4 ring-blue-100 animate-pulse' :
                                    step.status === 'rejected' ? 'bg-red-500 text-white' :
                                        'bg-gray-200 text-gray-400'
                            }`}>
                            {step.status === 'completed' ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : step.status === 'rejected' ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : step.status === 'current' ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            ) : (
                                <span className="text-sm font-medium">{step.stage}</span>
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <h4 className={`font-medium ${step.status === 'completed' ? 'text-emerald-700' :
                                        step.status === 'current' ? 'text-blue-700' :
                                            step.status === 'rejected' ? 'text-red-700' :
                                                'text-gray-500'
                                    }`}>
                                    {step.label}
                                </h4>
                                {step.timestamp && (
                                    <span className="text-xs text-gray-400">
                                        {new Date(step.timestamp).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gray-500 mt-0.5">{step.description}</p>

                            {/* Approvers */}
                            {step.requiresBoth ? (
                                <div className="mt-2 space-y-1">
                                    {step.approver && (
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                            <span className="text-gray-600">{step.approver.full_name}</span>
                                            <span className="text-gray-400">({step.approver.role?.replace(/_/g, ' ')})</span>
                                        </div>
                                    )}
                                    {step.secondApprover && (
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                            <span className="text-gray-600">{step.secondApprover.full_name}</span>
                                            <span className="text-gray-400">({step.secondApprover.role?.replace(/_/g, ' ')})</span>
                                        </div>
                                    )}
                                    {step.status === 'current' && (!step.approver || !step.secondApprover) && (
                                        <div className="flex items-center gap-2 text-xs text-amber-600">
                                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                            <span>Awaiting {!step.approver && 'OIC'}{!step.approver && !step.secondApprover && ' & '}{!step.secondApprover && 'Asst. OIC'} approval</span>
                                        </div>
                                    )}
                                </div>
                            ) : step.approver && step.status === 'completed' ? (
                                <div className="flex items-center gap-2 mt-2 text-xs">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span className="text-gray-600">{step.approver.full_name}</span>
                                </div>
                            ) : null}

                            {/* Rejection reason */}
                            {step.status === 'rejected' && request.rejection_reason && (
                                <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded-lg">
                                    <p className="text-xs text-red-700">
                                        <strong>Reason:</strong> {request.rejection_reason}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
