export const dynamic = 'force-dynamic';

import { getCurrentUser } from '@/app/actions/auth';
import { getInventory, getLabs } from '@/app/actions/inventory';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { UserRole } from '@/types/clearance';

// Lab icons/colors for visual variety
const LAB_THEMES: Record<string, { bg: string; icon: string; border: string }> = {
    CNET: { bg: 'from-blue-500 to-blue-600', icon: '🖥️', border: 'border-blue-200' },
    DLD: { bg: 'from-purple-500 to-purple-600', icon: '⚡', border: 'border-purple-200' },
    EMB: { bg: 'from-emerald-500 to-emerald-600', icon: '🔧', border: 'border-emerald-200' },
    IOT: { bg: 'from-orange-500 to-orange-600', icon: '📡', border: 'border-orange-200' },
    ROBO: { bg: 'from-pink-500 to-pink-600', icon: '🤖', border: 'border-pink-200' },
};

export default async function InventoryPage() {
    const user = await getCurrentUser();
    if (!user) redirect('/login');

    const role = user.role as UserRole;
    const isStudent = role === 'student';
    const isLabStaff = ['lab_engineer', 'lab_assistant'].includes(role);
    const isAdmin = ['hod', 'pro_hod', 'oic_cen_labs', 'asst_oic_cen_labs'].includes(role);

    // Get all labs
    const { data: labs } = await getLabs();

    // Filter labs for lab staff - only show their assigned lab
    let visibleLabs = labs || [];
    if (isLabStaff && user.assigned_lab_id) {
        visibleLabs = labs?.filter(l => l.id === user.assigned_lab_id) || [];
    }

    // Get inventory counts for each lab
    const labInventoryCounts = await Promise.all(
        (labs || []).map(async (lab) => {
            const { data: inv } = await getInventory(lab.id);
            return {
                labId: lab.id,
                total: inv?.length || 0,
                available: inv?.filter(i => i.status === 'available').length || 0,
            };
        })
    );

    // Get all inventory for "All Equipment" card (only for admins)
    const { data: allInventory } = await getInventory();
    const allStats = {
        total: allInventory?.length || 0,
        available: allInventory?.filter(i => i.status === 'available').length || 0,
    };

    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {isStudent ? 'Browse Equipment' : 'Equipment Inventory'}
                    </h1>
                    <p className="text-gray-500 mt-1">
                        {isStudent
                            ? 'Select a lab to view and request equipment'
                            : isLabStaff
                                ? `Managing inventory for your assigned lab`
                                : 'Manage equipment across all laboratories'}
                    </p>
                </div>

                {/* Add Equipment Button - only for authorized roles */}
                {(isAdmin || isLabStaff) && (
                    <Link
                        href="/inventory/new"
                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 shadow-lg flex items-center gap-2 font-medium"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Equipment
                    </Link>
                )}
            </div>

            {/* Stats Summary - Admin only */}
            {isAdmin && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                        <p className="text-sm text-gray-500 mb-1">Total Equipment</p>
                        <p className="text-3xl font-bold text-gray-900">{allStats.total}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                        <p className="text-sm text-gray-500 mb-1">Available</p>
                        <p className="text-3xl font-bold text-green-600">{allStats.available}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                        <p className="text-sm text-gray-500 mb-1">In Use</p>
                        <p className="text-3xl font-bold text-blue-600">{allStats.total - allStats.available}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                        <p className="text-sm text-gray-500 mb-1">Labs</p>
                        <p className="text-3xl font-bold text-purple-600">{labs?.length || 0}</p>
                    </div>
                </div>
            )}

            {/* Lab Cards Grid */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    {isLabStaff ? 'Your Assigned Lab' : 'Laboratory Inventory'}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* All Equipment Card - Admin only */}
                    {isAdmin && (
                        <Link
                            href="/inventory/all"
                            className="group relative bg-white rounded-2xl shadow-lg border-2 border-gray-200 hover:border-emerald-400 hover:shadow-xl transition-all duration-300 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-600 to-gray-800 opacity-5"></div>
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-2xl shadow-lg">
                                        📦
                                    </div>
                                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                                        ALL LABS
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                                    All Equipment
                                </h3>
                                <p className="text-sm text-gray-500 mt-1 mb-4">View equipment from all laboratories</p>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
                                        <span className="text-sm text-gray-600">{allStats.total} total</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                                        <span className="text-sm text-gray-600">{allStats.available} available</span>
                                    </div>
                                </div>
                            </div>
                            <div className="h-1 bg-gradient-to-r from-gray-600 to-gray-800 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                        </Link>
                    )}

                    {/* Individual Lab Cards */}
                    {visibleLabs.map((lab) => {
                        const theme = LAB_THEMES[lab.code] || { bg: 'from-gray-500 to-gray-600', icon: '🏢', border: 'border-gray-200' };
                        const counts = labInventoryCounts.find(c => c.labId === lab.id) || { total: 0, available: 0 };
                        const canEdit = isAdmin || (isLabStaff && user.assigned_lab_id === lab.id);

                        return (
                            <Link
                                key={lab.id}
                                href={`/inventory/lab/${lab.code}`}
                                className={`group relative bg-white rounded-2xl shadow-lg border-2 ${theme.border} hover:border-emerald-400 hover:shadow-xl transition-all duration-300 overflow-hidden`}
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${theme.bg} opacity-5`}></div>
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${theme.bg} flex items-center justify-center text-2xl shadow-lg`}>
                                            {theme.icon}
                                        </div>
                                        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                                            {lab.code}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                                        {lab.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1 mb-4">
                                        {canEdit ? 'Manage inventory' : 'View and request equipment'}
                                    </p>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
                                            <span className="text-sm text-gray-600">{counts.total} items</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                                            <span className="text-sm text-gray-600">{counts.available} available</span>
                                        </div>
                                    </div>
                                </div>
                                <div className={`h-1 bg-gradient-to-r ${theme.bg} transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left`}></div>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Quick Actions for Lab Staff */}
            {isLabStaff && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Link
                            href="/inventory/new"
                            className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors"
                        >
                            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-emerald-800">Add Equipment</p>
                                <p className="text-sm text-emerald-600">Register new item</p>
                            </div>
                        </Link>
                        <Link
                            href="/maintenance"
                            className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200 hover:bg-yellow-100 transition-colors"
                        >
                            <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center text-white">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-yellow-800">Maintenance</p>
                                <p className="text-sm text-yellow-600">Schedule repairs</p>
                            </div>
                        </Link>
                        <Link
                            href="/requests"
                            className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
                        >
                            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-blue-800">Pending Requests</p>
                                <p className="text-sm text-blue-600">Review approvals</p>
                            </div>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
