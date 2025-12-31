import { getCurrentUser } from '@/app/actions/auth';
import { getInventory, getLabs } from '@/app/actions/inventory';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function InventoryPage() {
    const user = await getCurrentUser();
    if (!user) redirect('/login');

    // Filter based on role
    let labFilter = undefined;
    if (['lab_incharge', 'lab_assistant'].includes(user.role)) {
        labFilter = user.assigned_lab_id; // Using the new schema field
    }

    const { data: inventory } = await getInventory(labFilter);
    const { data: labs } = await getLabs();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
                    <p className="text-sm text-gray-500">
                        {user.role === 'hod' ? 'Viewing all laboratory assets' : 'Managing your assigned lab usage'}
                    </p>
                </div>

                {['lab_incharge', 'hod'].includes(user.role) && (
                    <Link
                        href="/inventory/new"
                        className="bg-[#105a4b] hover:bg-[#0d473b] text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
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
                                <th className="px-6 py-3 text-left text-xs font-semibold text-[#105a4b] uppercase tracking-wider">Purchase Date</th>
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
                                                {item.labs?.name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{item.model || '-'}</div>
                                            <div className="text-xs text-gray-500">{item.serial_no || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.purchase_date ? new Date(item.purchase_date).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${item.status === 'available' ? 'bg-green-100 text-green-800' :
                                                    item.status === 'borrowed' ? 'bg-blue-100 text-blue-800' :
                                                        item.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button className="text-[#105a4b] hover:text-[#0d473b] mr-3">Edit</button>
                                            {/* Request Button for Students */}
                                            {user.role === 'student' && (
                                                <Link
                                                    href={`/clearance?labId=${item.lab_id}&itemId=${item.id}`}
                                                    className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-[#105a4b] bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#105a4b]"
                                                >
                                                    Request
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        <p className="text-sm">No inventory found.</p>
                                        {user.role === 'hod' && <p className="text-xs mt-1">Try adding some equipment.</p>}
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
