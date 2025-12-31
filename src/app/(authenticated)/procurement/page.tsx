
import { getCurrentUser } from '@/app/actions/auth';
import { getProcurementRequests } from '@/app/actions/procurement';
import { CreateProcurementForm } from './CreateProcurementForm';
import { ProcurementActionButtons } from './ProcurementActionButtons';
import { redirect } from 'next/navigation';

export default async function ProcurementPage() {
    const user = await getCurrentUser();
    if (!user) redirect('/login');

    const { data: requests } = await getProcurementRequests();
    const isHod = ['hod', 'pro_hod'].includes(user.role);
    const isStaff = ['lab_incharge', 'lab_assistant'].includes(user.role);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Procurement & Purchases</h1>
                    <p className="text-sm text-gray-500">
                        {isHod ? 'Review and approve equipment purchase requests.' : 'Request new equipment or repairs.'}
                    </p>
                </div>
            </div>

            {isStaff && <CreateProcurementForm />}

            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200 font-medium text-gray-700">
                    Request History
                </div>

                {!requests || requests.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No procurement requests found.
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lab / Requester</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost (Est)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                {isHod && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {requests.map((req: any) => (
                                <tr key={req.id}>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{req.item_name}</div>
                                        <div className="text-xs text-gray-500">{req.specification || 'No specs'}</div>
                                        <div className="text-xs text-gray-400 mt-1">Qty: {req.quantity}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900">{req.labs?.name}</div>
                                        <div className="text-xs text-gray-500">{req.profiles?.full_name}</div>
                                        <div className="text-xs text-gray-400 italic mt-1 max-w-[150px] truncate" title={req.justification}>
                                            "{req.justification}"
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        PKR {req.estimated_cost_per_unit * req.quantity}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                       ${req.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                req.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {req.status?.replace('_', ' ').toUpperCase()}
                                        </span>
                                        {req.admin_comments && (
                                            <div className="text-xs text-red-500 mt-1">{req.admin_comments}</div>
                                        )}
                                    </td>
                                    {isHod && (
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {req.status === 'pending_hod' && (
                                                <ProcurementActionButtons requestId={req.id} />
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
