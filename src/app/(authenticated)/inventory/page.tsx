export const dynamic = 'force-dynamic';

import { getCurrentUser } from '@/app/actions/auth';
import { getInventory, getLabs } from '@/app/actions/inventory';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { UserRole } from '@/types/clearance';

export default async function InventoryPage() {
    const user = await getCurrentUser();
    if (!user) redirect('/login');

    const role = user.role as UserRole;
    const isStudent = role === 'student';
    const isLabStaff = ['lab_engineer', 'lab_assistant'].includes(role);
    const isAdmin = ['hod', 'pro_hod', 'oic_cen_labs', 'asst_oic_cen_labs'].includes(role);
    const canEdit = !isStudent; // Everyone except students can edit
    const canAdd = isAdmin || isLabStaff; // Lab staff and admins can add

    // Filter inventory by assigned lab for lab staff
    let labFilter = undefined;
    if (isLabStaff && user.assigned_lab_id) {
        labFilter = user.assigned_lab_id;
    }

    const { data: inventory } = await getInventory(labFilter);
    const { data: labs } = await getLabs();

    // For lab staff, get their assigned lab name
    const assignedLabName = labs?.find(l => l.id === user.assigned_lab_id)?.name;

    return (
        <div className="space-y-6 p-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isLabStaff && assignedLabName ? `${assignedLabName} Inventory` : 'Inventory Management'}
                    </h1>
                    <p className="text-sm text-gray-500">
                        {isStudent
                            ? 'Browse available lab equipment'
                            : isLabStaff
                                ? `Managing inventory for ${assignedLabName || 'your assigned lab'}`
                                : 'Viewing all laboratory assets'}
                    </p>
                </div>

                {canAdd && (
                    <Link
                        href="/inventory/new"
                        className="bg-[#105a4b] hover:bg-[#0d473b] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-lg"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Equipment
                    </Link>
                )}
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-[#e6f5f3]">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-[#105a4b] uppercase tracking-wider">Asset Name</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-[#105a4b] uppercase tracking-wider">Lab</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-[#105a4b] uppercase tracking-wider">Model / Serial</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-[#105a4b] uppercase tracking-wider">Quantity</th>
                                {!isStudent && (
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#105a4b] uppercase tracking-wider">Purchase Date</th>
                                )}
                                <th className="px-6 py-3 text-left text-xs font-semibold text-[#105a4b] uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-[#105a4b] uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {inventory && inventory.length > 0 ? (
                                inventory.map((item: any) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                            <div className="text-xs text-gray-500">Tag: {item.asset_tag || 'N/A'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                {item.labs?.name || '—'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{item.model || '-'}</div>
                                            <div className="text-xs text-gray-500">{item.serial_no || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`text-sm font-medium ${(item.quantity || 1) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {item.quantity || 1}
                                            </span>
                                        </td>
                                        {!isStudent && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {item.purchase_date ? new Date(item.purchase_date).toLocaleDateString() : '-'}
                                            </td>
                                        )}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${item.status === 'available' ? 'bg-green-100 text-green-800' :
                                                    item.status === 'borrowed' ? 'bg-blue-100 text-blue-800' :
                                                        item.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {/* Edit button - only for staff */}
                                            {canEdit && (
                                                <Link
                                                    href={`/inventory/${item.id}/edit`}
                                                    className="text-[#105a4b] hover:text-[#0d473b] mr-3"
                                                >
                                                    Edit
                                                </Link>
                                            )}
                                            {/* Request Button - only for students when item is available */}
                                            {isStudent && item.status === 'available' && (
                                                <Link
                                                    href={`/clearance?lab=${item.lab_id}&item=${item.id}`}
                                                    className="inline-flex items-center px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700"
                                                >
                                                    Request
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={isStudent ? 6 : 7} className="px-6 py-12 text-center text-gray-500">
                                        <p className="text-sm">No inventory found.</p>
                                        {canAdd && <p className="text-xs mt-1">Try adding some equipment.</p>}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
