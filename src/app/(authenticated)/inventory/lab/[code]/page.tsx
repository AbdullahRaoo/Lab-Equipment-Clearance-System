export const dynamic = 'force-dynamic';

import { getCurrentUser } from '@/app/actions/auth';
import { getInventory, getLabs } from '@/app/actions/inventory';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { UserRole } from '@/types/clearance';

interface PageProps {
    params: Promise<{ code: string }>;
}

export default async function LabInventoryPage({ params }: PageProps) {
    const { code: labCode } = await params;
    const user = await getCurrentUser();
    if (!user) redirect('/login');

    const role = user.role as UserRole;
    const isStudent = role === 'student';
    const isLabStaff = ['lab_engineer', 'lab_assistant'].includes(role);
    const isAdmin = ['hod', 'pro_hod', 'oic_cen_labs', 'asst_oic_cen_labs'].includes(role);

    // Get lab by code
    const { data: labs } = await getLabs();
    const lab = labs?.find(l => l.code === labCode.toUpperCase());

    if (!lab) {
        notFound();
    }

    // Check if lab staff can access this lab
    const canEdit = isAdmin || (isLabStaff && user.assigned_lab_id === lab.id);

    // Lab staff can only access their assigned lab
    if (isLabStaff && user.assigned_lab_id !== lab.id) {
        redirect('/inventory');
    }

    // Get inventory for this lab
    const { data: inventory } = await getInventory(lab.id);

    const stats = {
        total: inventory?.length || 0,
        available: inventory?.filter(i => i.status === 'available').length || 0,
        borrowed: inventory?.filter(i => i.status === 'borrowed').length || 0,
        maintenance: inventory?.filter(i => i.status === 'maintenance').length || 0,
    };

    return (
        <div className="p-8 space-y-6">
            {/* Breadcrumb & Header */}
            <div className="flex flex-col gap-4">
                <Link href="/inventory" className="text-emerald-600 hover:text-emerald-700 text-sm flex items-center gap-1 w-fit">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Inventory
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{lab.name}</h1>
                        <p className="text-gray-500 mt-1">Lab Code: {lab.code}</p>
                    </div>

                    {canEdit && (
                        <Link
                            href={`/inventory/new?lab=${lab.id}`}
                            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 shadow-lg flex items-center gap-2 font-medium"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Equipment
                        </Link>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Total Equipment</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Available</p>
                    <p className="text-3xl font-bold text-green-600">{stats.available}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Borrowed</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.borrowed}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Maintenance</p>
                    <p className="text-3xl font-bold text-yellow-600">{stats.maintenance}</p>
                </div>
            </div>

            {/* Equipment Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50">
                    <h2 className="text-lg font-semibold text-gray-900">Equipment List</h2>
                    <p className="text-sm text-gray-500">{stats.total} items in this laboratory</p>
                </div>

                {inventory && inventory.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model / Serial</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                    {!isStudent && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Date</th>
                                    )}
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {inventory.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                            <div className="text-xs text-gray-500">{item.asset_tag || 'No tag'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">{item.model || '-'}</div>
                                            <div className="text-xs text-gray-500">{item.serial_no || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-sm font-medium ${(item.quantity || 1) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {item.quantity || 1}
                                            </span>
                                        </td>
                                        {!isStudent && (
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {item.purchase_date ? new Date(item.purchase_date).toLocaleDateString() : '-'}
                                            </td>
                                        )}
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${item.status === 'available' ? 'bg-green-100 text-green-800' :
                                                    item.status === 'borrowed' ? 'bg-blue-100 text-blue-800' :
                                                        item.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {isStudent && item.status === 'available' ? (
                                                <Link
                                                    href={`/clearance?lab=${lab.id}&item=${item.id}`}
                                                    className="inline-flex items-center px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700"
                                                >
                                                    Request
                                                </Link>
                                            ) : canEdit ? (
                                                <Link
                                                    href={`/inventory/${item.id}/edit`}
                                                    className="text-emerald-600 hover:text-emerald-800 text-sm font-medium"
                                                >
                                                    Edit
                                                </Link>
                                            ) : null}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <p className="text-gray-500">No equipment found in this lab</p>
                        {canEdit && (
                            <Link
                                href={`/inventory/new?lab=${lab.id}`}
                                className="mt-4 inline-block text-emerald-600 hover:text-emerald-700"
                            >
                                Add your first equipment →
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
