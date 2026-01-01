export const dynamic = 'force-dynamic';

import { getCurrentUser } from '@/app/actions/auth';
import { getInventoryItem, getLabs, updateInventoryItem } from '@/app/actions/inventory';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { UserRole } from '@/types/clearance';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function EditEquipmentPage({ params }: PageProps) {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) redirect('/login');

    const role = user.role as UserRole;
    const isStudent = role === 'student';
    const isLabStaff = ['lab_engineer', 'lab_assistant'].includes(role);
    const isAdmin = ['hod', 'pro_hod', 'oic_cen_labs', 'asst_oic_cen_labs'].includes(role);

    // Students cannot edit
    if (isStudent) {
        redirect('/inventory');
    }

    // Get the equipment item
    const { data: item, error } = await getInventoryItem(id);

    if (error || !item) {
        notFound();
    }

    // Lab staff can only edit their assigned lab's equipment
    if (isLabStaff && user.assigned_lab_id !== item.lab_id) {
        redirect('/inventory');
    }

    // Get all labs for dropdown
    const { data: labs } = await getLabs();

    return (
        <div className="p-8 max-w-3xl mx-auto">
            {/* Breadcrumb */}
            <Link href="/inventory" className="text-emerald-600 hover:text-emerald-700 text-sm flex items-center gap-1 mb-6">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Inventory
            </Link>

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Edit Equipment</h1>
                <p className="text-gray-500 mt-1">Update details for {item.name}</p>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-2xl shadow-lg">
                            🔧
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{item.name}</h2>
                            <p className="text-sm text-gray-500">{item.asset_tag || 'No asset tag'}</p>
                        </div>
                    </div>
                </div>

                <form action={async (formData: FormData) => {
                    'use server';
                    await updateInventoryItem(id, formData);
                    redirect('/inventory');
                }} className="p-6 space-y-6">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Equipment Name *</label>
                        <input
                            type="text"
                            name="name"
                            defaultValue={item.name}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>

                    {/* Model & Serial */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                            <input
                                type="text"
                                name="model"
                                defaultValue={item.model || ''}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Serial Number</label>
                            <input
                                type="text"
                                name="serial_no"
                                defaultValue={item.serial_no || ''}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                    </div>

                    {/* Asset Tag & Quantity */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Asset Tag</label>
                            <input
                                type="text"
                                name="asset_tag"
                                defaultValue={item.asset_tag || ''}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                            <input
                                type="number"
                                name="quantity"
                                defaultValue={item.quantity || 1}
                                min="0"
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                    </div>

                    {/* Lab & Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Laboratory *</label>
                            <select
                                name="lab_id"
                                defaultValue={item.lab_id}
                                required
                                disabled={isLabStaff}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
                            >
                                {labs?.map(lab => (
                                    <option key={lab.id} value={lab.id}>{lab.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                            <select
                                name="status"
                                defaultValue={item.status}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            >
                                <option value="available">Available</option>
                                <option value="borrowed">Borrowed</option>
                                <option value="maintenance">Under Maintenance</option>
                                <option value="lost">Lost</option>
                                <option value="retired">Retired</option>
                            </select>
                        </div>
                    </div>

                    {/* Condition & Purchase Date */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
                            <select
                                name="condition"
                                defaultValue={item.condition || 'good'}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            >
                                <option value="new">New</option>
                                <option value="good">Good</option>
                                <option value="fair">Fair</option>
                                <option value="poor">Poor</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Date</label>
                            <input
                                type="date"
                                name="purchase_date"
                                defaultValue={item.purchase_date?.split('T')[0] || ''}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                    </div>

                    {/* Price & Supplier */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Price (PKR)</label>
                            <input
                                type="number"
                                name="price"
                                defaultValue={item.price || ''}
                                min="0"
                                step="0.01"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
                            <input
                                type="text"
                                name="supplier"
                                defaultValue={item.supplier || ''}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-6 border-t">
                        <Link
                            href="/inventory"
                            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-center font-medium hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-medium hover:from-emerald-700 hover:to-teal-700 transition-colors shadow-lg"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
