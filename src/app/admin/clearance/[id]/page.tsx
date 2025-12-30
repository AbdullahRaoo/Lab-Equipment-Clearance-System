import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCertificateByRequestId } from '@/app/actions/certificate';
import {
    getAllUserBorrowedEquipment,
    getAllUserUnpaidIssues
} from '@/app/actions/clearance';
import { LAB_NAMES, REQUEST_TYPE_LABELS, LAB_STATUS_COLORS } from '@/types/clearance';
import Link from 'next/link';
import { LabReviewActions } from './LabReviewActions';

interface AdminReviewPageProps {
    params: Promise<{ id: string }>;
}

export default async function AdminReviewPage({ params }: AdminReviewPageProps) {
    const { id: requestId } = await params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Get user profile and verify admin access
    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', user.id)
        .single();

    if (!profile || !['admin', 'lab_admin'].includes(profile.role)) {
        redirect('/dashboard');
    }

    // Get clearance request details
    const { data: request, error } = await getCertificateByRequestId(requestId);

    if (error || !request) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Request Not Found</h1>
                    <p className="text-gray-600 mb-6">{error || 'The clearance request could not be found.'}</p>
                    <Link
                        href="/admin/clearance"
                        className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Back to Clearance Management
                    </Link>
                </div>
            </div>
        );
    }

    // Get student's borrowed equipment and unpaid issues
    const { data: borrowedEquipment } = await getAllUserBorrowedEquipment(request.user_id);
    const { data: unpaidIssues } = await getAllUserUnpaidIssues(request.user_id);

    const labs = ['lab1', 'lab2', 'lab3', 'lab4', 'lab5'] as const;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <Link
                            href="/admin/clearance"
                            className="text-blue-600 hover:text-blue-800 text-sm mb-2 block"
                        >
                            ← Back to Clearance Management
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900">Review Clearance Request</h1>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${request.status === 'approved' ? 'bg-green-100 text-green-800' :
                            request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                request.status === 'in_review' ? 'bg-blue-100 text-blue-800' :
                                    'bg-red-100 text-red-800'
                        }`}>
                        {request.status.replace('_', ' ').toUpperCase()}
                    </span>
                </div>

                {/* Student Info */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">Student Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Name</p>
                            <p className="font-medium">{request.user?.full_name || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-medium">{request.user?.email || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Student ID</p>
                            <p className="font-medium">{request.user?.student_id || 'N/A'}</p>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Request Type</p>
                                <p className="font-medium">
                                    {REQUEST_TYPE_LABELS[request.request_type as keyof typeof REQUEST_TYPE_LABELS] || request.request_type}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Requested On</p>
                                <p className="font-medium">{new Date(request.created_at).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Valid Until</p>
                                <p className="font-medium">
                                    {request.valid_until ? new Date(request.valid_until).toLocaleDateString() : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lab Review Section */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">Lab Clearance Status</h2>
                    <div className="space-y-4">
                        {labs.map((lab) => {
                            const status = request[`${lab}_status` as keyof typeof request] as string;
                            const reviewedAt = request[`${lab}_reviewed_at` as keyof typeof request] as string | null;

                            // Get equipment from this lab
                            const labEquipment = borrowedEquipment?.filter(e => e.lab_schema === lab) || [];
                            const labIssues = unpaidIssues?.filter(i => i.lab_schema === lab) || [];

                            return (
                                <div key={lab} className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-semibold">{LAB_NAMES[lab]}</h3>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${LAB_STATUS_COLORS[status as keyof typeof LAB_STATUS_COLORS] || 'bg-gray-100'}`}>
                                                {status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        {reviewedAt && (
                                            <p className="text-xs text-gray-500">
                                                Reviewed: {new Date(reviewedAt).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>

                                    {/* Issues Summary */}
                                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                                        <div className="bg-gray-50 rounded p-3">
                                            <p className="text-gray-500">Borrowed Equipment</p>
                                            <p className="font-bold text-lg">
                                                {labEquipment.length}
                                                {labEquipment.filter(e => e.is_overdue).length > 0 && (
                                                    <span className="text-red-600 text-sm ml-2">
                                                        ({labEquipment.filter(e => e.is_overdue).length} overdue)
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 rounded p-3">
                                            <p className="text-gray-500">Unpaid Fines</p>
                                            <p className="font-bold text-lg">
                                                ${labIssues.reduce((sum, i) => sum + i.total_amount, 0).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {status !== 'cleared' && (
                                        <LabReviewActions
                                            requestId={requestId}
                                            labSchema={lab}
                                            currentStatus={status}
                                            hasIssues={labEquipment.length > 0 || labIssues.length > 0}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Borrowed Equipment Details */}
                {borrowedEquipment && borrowedEquipment.length > 0 && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-lg font-semibold mb-4">Borrowed Equipment ({borrowedEquipment.length})</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Lab</th>
                                        <th className="px-4 py-2 text-left">Equipment</th>
                                        <th className="px-4 py-2 text-left">Borrowed</th>
                                        <th className="px-4 py-2 text-left">Due</th>
                                        <th className="px-4 py-2 text-left">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {borrowedEquipment.map((item, idx) => (
                                        <tr key={idx} className="border-t">
                                            <td className="px-4 py-2">{LAB_NAMES[item.lab_schema]}</td>
                                            <td className="px-4 py-2">{item.equipment_name}</td>
                                            <td className="px-4 py-2">{new Date(item.borrowed_at).toLocaleDateString()}</td>
                                            <td className="px-4 py-2">{new Date(item.due_date).toLocaleDateString()}</td>
                                            <td className="px-4 py-2">
                                                {item.is_overdue ? (
                                                    <span className="text-red-600 font-medium">Overdue ({item.days_overdue} days)</span>
                                                ) : (
                                                    <span className="text-green-600">Active</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Unpaid Issues */}
                {unpaidIssues && unpaidIssues.length > 0 && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-lg font-semibold mb-4">Unpaid Fines ({unpaidIssues.length})</h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Lab</th>
                                        <th className="px-4 py-2 text-left">Type</th>
                                        <th className="px-4 py-2 text-left">Description</th>
                                        <th className="px-4 py-2 text-left">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {unpaidIssues.map((issue, idx) => (
                                        <tr key={idx} className="border-t">
                                            <td className="px-4 py-2">{LAB_NAMES[issue.lab_schema]}</td>
                                            <td className="px-4 py-2">{issue.issue_type}</td>
                                            <td className="px-4 py-2">{issue.description}</td>
                                            <td className="px-4 py-2 font-medium">${issue.total_amount.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
