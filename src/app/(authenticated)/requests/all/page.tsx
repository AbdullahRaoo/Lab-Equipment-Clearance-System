import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/actions/auth';
import { UserRole, ROLE_LABELS, STATUS_LABELS, STATUS_COLORS, isAdminRole } from '@/types/clearance';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import RequestCard from '@/components/RequestCard';

export const dynamic = 'force-dynamic';

async function getAllRequestsForFaculty(labId?: string) {
    const supabase = await createClient();

    let query = supabase
        .from('borrow_requests')
        .select(`
            *,
            profiles:user_id (id, full_name, email, reg_no),
            labs:lab_id (id, name, code),
            borrow_request_items (
                quantity_requested,
                inventory:inventory_id (id, name, model, asset_tag)
            )
        `)
        .order('created_at', { ascending: false });

    if (labId) {
        query = query.eq('lab_id', labId);
    }

    const { data, error } = await query;
    if (error) return [];
    return data;
}

export default async function AllRequestsPage({
    searchParams
}: {
    searchParams: Promise<{ status?: string; lab?: string }>
}) {
    const user = await getCurrentUser();
    if (!user) redirect('/login');

    const role = user.role as UserRole;
    const isLabStaff = ['lab_engineer', 'lab_assistant'].includes(role);
    const isFaculty = !['student'].includes(role);

    if (!isFaculty) {
        redirect('/requests');
    }

    const params = await searchParams;
    const statusFilter = params.status || 'all';
    const labFilter = params.lab || 'all';

    // Get all requests (filtered by lab for lab staff)
    const labId = isLabStaff ? user.assigned_lab_id : (labFilter !== 'all' ? labFilter : undefined);
    const allRequests = await getAllRequestsForFaculty(labId);

    // Get labs for filter
    const supabase = await createClient();
    const { data: labs } = await supabase.from('labs').select('id, name, code').order('name');

    // Filter by status
    let filteredRequests = allRequests;
    if (statusFilter !== 'all') {
        filteredRequests = allRequests.filter(r => r.status === statusFilter);
    }

    // Group by status for stats
    const stats = {
        total: allRequests.length,
        submitted: allRequests.filter(r => r.status === 'submitted' || r.status === 'stage1_pending').length,
        stage1: allRequests.filter(r => r.status === 'stage1_approved').length,
        stage2: allRequests.filter(r => r.status === 'stage2_pending' || r.status === 'stage2_approved').length,
        stage3: allRequests.filter(r => r.status === 'stage3_pending').length,
        approved: allRequests.filter(r => r.status === 'approved').length,
        handedOver: allRequests.filter(r => r.status === 'handed_over').length,
        returned: allRequests.filter(r => r.status === 'returned').length,
        rejected: allRequests.filter(r => r.status === 'rejected').length,
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">All Equipment Requests</h1>
                    <p className="text-gray-500 mt-1">
                        Complete overview of all requests {isLabStaff ? 'for your lab' : 'across all labs'}
                    </p>
                </div>
                <Link
                    href="/requests"
                    className="px-4 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to My Queue
                </Link>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
                <StatBadge label="Total" value={stats.total} active={statusFilter === 'all'} href="?status=all" color="gray" />
                <StatBadge label="Pending Lab" value={stats.submitted} active={statusFilter === 'submitted'} href="?status=submitted" color="yellow" />
                <StatBadge label="Lab Approved" value={stats.stage1} active={statusFilter === 'stage1_approved'} href="?status=stage1_approved" color="orange" />
                <StatBadge label="At OIC" value={stats.stage2} active={statusFilter === 'stage2_pending'} href="?status=stage2_pending" color="purple" />
                <StatBadge label="At HOD" value={stats.stage3} active={statusFilter === 'stage3_pending'} href="?status=stage3_pending" color="pink" />
                <StatBadge label="Ready" value={stats.approved} active={statusFilter === 'approved'} href="?status=approved" color="green" />
                <StatBadge label="With Student" value={stats.handedOver} active={statusFilter === 'handed_over'} href="?status=handed_over" color="blue" />
                <StatBadge label="Returned" value={stats.returned} active={statusFilter === 'returned'} href="?status=returned" color="slate" />
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Status:</span>
                        <select
                            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500"
                            defaultValue={statusFilter}
                            onChange={(e) => {
                                const url = new URL(window.location.href);
                                url.searchParams.set('status', e.target.value);
                                window.location.href = url.toString();
                            }}
                        >
                            <option value="all">All Statuses</option>
                            <option value="submitted">Pending Lab Staff</option>
                            <option value="stage1_approved">Lab Staff Approved</option>
                            <option value="stage2_pending">Pending OIC</option>
                            <option value="stage2_approved">OIC Approved</option>
                            <option value="stage3_pending">Pending HOD</option>
                            <option value="approved">Ready for Pickup</option>
                            <option value="handed_over">Equipment With Student</option>
                            <option value="returned">Returned</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>

                    {!isLabStaff && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Lab:</span>
                            <select
                                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500"
                                defaultValue={labFilter}
                                onChange={(e) => {
                                    const url = new URL(window.location.href);
                                    url.searchParams.set('lab', e.target.value);
                                    window.location.href = url.toString();
                                }}
                            >
                                <option value="all">All Labs</option>
                                {labs?.map(lab => (
                                    <option key={lab.id} value={lab.id}>{lab.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="ml-auto text-sm text-gray-500">
                        Showing {filteredRequests.length} of {allRequests.length} requests
                    </div>
                </div>
            </div>

            {/* Requests List */}
            {filteredRequests.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredRequests.map(request => (
                        <RequestCard
                            key={request.id}
                            request={request}
                            userRole={role}
                            showActions={true}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-gray-50 rounded-xl">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-700">No Requests Found</h3>
                    <p className="text-gray-500 mt-1">
                        {statusFilter !== 'all'
                            ? `No requests with status "${STATUS_LABELS[statusFilter as keyof typeof STATUS_LABELS] || statusFilter}"`
                            : 'No equipment requests have been made yet.'}
                    </p>
                </div>
            )}
        </div>
    );
}

function StatBadge({
    label,
    value,
    active,
    href,
    color
}: {
    label: string;
    value: number;
    active: boolean;
    href: string;
    color: string;
}) {
    const colorClasses: Record<string, string> = {
        gray: 'bg-gray-100 text-gray-700 border-gray-300',
        yellow: 'bg-yellow-100 text-yellow-700 border-yellow-300',
        orange: 'bg-orange-100 text-orange-700 border-orange-300',
        purple: 'bg-purple-100 text-purple-700 border-purple-300',
        pink: 'bg-pink-100 text-pink-700 border-pink-300',
        green: 'bg-green-100 text-green-700 border-green-300',
        blue: 'bg-blue-100 text-blue-700 border-blue-300',
        slate: 'bg-slate-100 text-slate-700 border-slate-300',
    };

    return (
        <Link
            href={href}
            className={`p-3 rounded-xl border-2 text-center transition-all hover:scale-105 ${active
                    ? `${colorClasses[color]} border-current ring-2 ring-offset-1`
                    : `bg-white border-gray-200 text-gray-600 hover:border-gray-300`
                }`}
        >
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs mt-1 truncate">{label}</p>
        </Link>
    );
}
