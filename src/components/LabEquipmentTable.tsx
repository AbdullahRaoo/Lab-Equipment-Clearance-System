'use client';

import Link from 'next/link';
import { UserRole } from '@/types/clearance';

interface Equipment {
    id: string;
    equipment_code?: string;
    equipment_name?: string;
    name?: string;
    asset_tag?: string;
    category?: string;
    status: string;
    condition?: string;
    quantity?: number;
    available_quantity?: number;
    purchase_date?: string;
}

interface LabEquipmentTableProps {
    inventory: Equipment[];
    labId: string;
    labCode: string;
    userRole: UserRole;
}

export function LabEquipmentTable({ inventory, labId, labCode, userRole }: LabEquipmentTableProps) {
    const isStudent = userRole === 'student';
    const isStaff = ['hod', 'pro_hod', 'oic_cen_labs', 'asst_oic_cen_labs', 'lab_engineer', 'lab_assistant'].includes(userRole);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available': return 'bg-green-100 text-green-800';
            case 'borrowed': return 'bg-blue-100 text-blue-800';
            case 'maintenance': return 'bg-yellow-100 text-yellow-800';
            case 'damaged': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50">
                <h2 className="text-xl font-semibold text-gray-900">Lab Equipment</h2>
                <p className="text-sm text-gray-500">
                    {inventory.length} items • {inventory.filter(i => i.status === 'available').length} available
                </p>
            </div>

            {inventory.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p>No equipment found in this lab</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Equipment
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Category
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Available Qty
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                {isStaff && (
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Condition
                                    </th>
                                )}
                                {isStaff && (
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Purchase Date
                                    </th>
                                )}
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {inventory.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {item.equipment_name || item.name || 'Unnamed'}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {item.equipment_code || item.asset_tag || 'No code'}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {item.category || '—'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`text-sm font-medium ${(item.available_quantity || item.quantity || 1) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {item.available_quantity || item.quantity || 1}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.status)}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    {isStaff && (
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {item.condition || '—'}
                                        </td>
                                    )}
                                    {isStaff && (
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.purchase_date ? new Date(item.purchase_date).toLocaleDateString() : '—'}
                                        </td>
                                    )}
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        {isStudent && item.status === 'available' ? (
                                            <Link
                                                href={`/clearance?lab=${labId}&item=${item.id}`}
                                                className="inline-flex items-center px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                                            >
                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                </svg>
                                                Request
                                            </Link>
                                        ) : isStaff ? (
                                            <Link
                                                href={`/inventory?edit=${item.id}`}
                                                className="text-emerald-600 hover:text-emerald-800 text-sm font-medium"
                                            >
                                                Manage
                                            </Link>
                                        ) : item.status !== 'available' ? (
                                            <span className="text-gray-400 text-sm">Unavailable</span>
                                        ) : null}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
