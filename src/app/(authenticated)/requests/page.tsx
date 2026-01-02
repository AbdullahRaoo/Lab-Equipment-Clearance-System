import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/actions/auth';
import { getPendingRequestsForApproval, getMyRequests, getRequestsForHandover } from '@/app/actions/equipment-request';
import { UserRole, STATUS_LABELS, ROLE_LABELS, isAdminRole } from '@/types/clearance';
import RequestCard from '@/components/RequestCard';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function RequestsPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    const role = user.role as UserRole;
    const isAdmin = isAdminRole(role);
    const isLabStaff = ['lab_engineer', 'lab_assistant'].includes(role);

    // Get appropriate requests based on role
    let requests: any[] = [];
    let handoverRequests: any[] = [];
    let pageTitle = 'Equipment Requests';
    let pageDescription = '';

    if (role === 'student') {
        const result = await getMyRequests();
        requests = result.data || [];
        pageTitle = 'My Equipment Requests';
        pageDescription = 'Track your equipment borrowing requests';
    } else {
        const result = await getPendingRequestsForApproval();
        requests = result.data || [];
        pageTitle = 'Pending Approvals';
        pageDescription = `Requests awaiting your review as ${ROLE_LABELS[role]}`;

        // For lab staff, also get handover/return requests
        if (isLabStaff) {
            const handoverResult = await getRequestsForHandover();
            handoverRequests = handoverResult.data || [];
        }
    }

    // Group requests by status for better organization
    const pendingRequests = requests.filter(r => !['returned', 'rejected'].includes(r.status));
    const completedRequests = requests.filter(r => ['returned', 'rejected'].includes(r.status));

    // Split handover requests
    const awaitingPickup = handoverRequests.filter(r => r.status === 'approved');
    const awaitingReturn = handoverRequests.filter(r => r.status === 'handed_over');

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
                    <p className="text-gray-500 mt-1">{pageDescription}</p>
                </div>
                {role === 'student' && (
                    <Link
                        href="/clearance"
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 shadow-lg"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        New Request
                    </Link>
                )}
            </div>

            {/* Stats for Admin/Staff */}
            {(isAdmin || isLabStaff) && (
                <div className="grid grid-cols-4 gap-4 mb-8">
                    <StatCard
                        label="Pending Review"
                        value={pendingRequests.length}
                        color="yellow"
                        icon="clock"
                    />
                    <StatCard
                        label="This Week"
                        value={requests.filter(r => isWithinDays(r.created_at, 7)).length}
                        color="blue"
                        icon="calendar"
                    />
                    <StatCard
                        label="Approved"
                        value={awaitingPickup.length}
                        color="green"
                        icon="check"
                    />
                    <StatCard
                        label="With Students"
                        value={awaitingReturn.length}
                        color="purple"
                        icon="truck"
                    />
                </div>
            )}

            {/* Pending Requests */}
            {pendingRequests.length > 0 ? (
                <div className="space-y-4">
                    <h2 className="font-semibold text-gray-700">
                        {role === 'student' ? 'Active Requests' : 'Awaiting Your Approval'}
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        {pendingRequests.map(request => (
                            <RequestCard
                                key={request.id}
                                request={request}
                                userRole={role}
                                showActions={role !== 'student'}
                            />
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-16 bg-gray-50 rounded-xl">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-700">No Pending Requests</h3>
                    <p className="text-gray-500 mt-1">
                        {role === 'student'
                            ? 'You haven\'t made any equipment requests yet.'
                            : 'All caught up! No requests need your approval right now.'}
                    </p>
                    {role === 'student' && (
                        <Link
                            href="/clearance"
                            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                        >
                            Request Equipment
                        </Link>
                    )}
                </div>
            )}

            {/* Handover Management - Lab Staff Only */}
            {isLabStaff && awaitingPickup.length > 0 && (
                <div className="mt-8 space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <h2 className="font-semibold text-gray-700">Ready for Pickup ({awaitingPickup.length})</h2>
                    </div>
                    <p className="text-sm text-gray-500">These requests are approved and waiting for the student to collect equipment</p>
                    <div className="grid gap-4 md:grid-cols-2">
                        {awaitingPickup.map(request => (
                            <RequestCard
                                key={request.id}
                                request={request}
                                userRole={role}
                                showActions={true}
                            />
                        ))}
                    </div>
                </div>
            )}

            {isLabStaff && awaitingReturn.length > 0 && (
                <div className="mt-8 space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                        <h2 className="font-semibold text-gray-700">Awaiting Return ({awaitingReturn.length})</h2>
                    </div>
                    <p className="text-sm text-gray-500">Equipment currently with students - mark as returned when received back</p>
                    <div className="grid gap-4 md:grid-cols-2">
                        {awaitingReturn.map(request => (
                            <RequestCard
                                key={request.id}
                                request={request}
                                userRole={role}
                                showActions={true}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Completed/History */}
            {completedRequests.length > 0 && (
                <div className="mt-12">
                    <h2 className="font-semibold text-gray-700 mb-4">History</h2>
                    <div className="grid gap-4 md:grid-cols-2 opacity-75">
                        {completedRequests.slice(0, 4).map(request => (
                            <RequestCard
                                key={request.id}
                                request={request}
                                userRole={role}
                                showActions={false}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
    const colorClasses = {
        yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        blue: 'bg-blue-50 text-blue-700 border-blue-200',
        green: 'bg-green-50 text-green-700 border-green-200',
        purple: 'bg-purple-50 text-purple-700 border-purple-200'
    };

    const iconPaths: Record<string, string> = {
        clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
        calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
        check: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
        truck: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0'
    };

    return (
        <div className={`p-4 rounded-xl border ${colorClasses[color as keyof typeof colorClasses]}`}>
            <div className="flex items-center gap-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPaths[icon]} />
                </svg>
                <div>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-sm opacity-80">{label}</p>
                </div>
            </div>
        </div>
    );
}

function isWithinDays(dateStr: string, days: number): boolean {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    return diff < days * 24 * 60 * 60 * 1000;
}
