
import { getCurrentUser } from '@/app/actions/auth';
import { getMaintenanceOverview } from '@/app/actions/maintenance';
import { LogMaintenanceForm } from './LogMaintenanceForm';
import { redirect } from 'next/navigation';

export default async function MaintenancePage() {
    const user = await getCurrentUser();
    if (!user) redirect('/login');

    if (['student'].includes(user.role)) {
        return <div className="p-8 text-center text-gray-500">Access Restricted. Staff Only.</div>;
    }

    const overview = await getMaintenanceOverview();

    // Need lab ID for form
    // We can assume user object has it if we joined, but getCurrentUser joins labs now? 
    // Let's check auth.ts logic. getCurrentUser joins `labs` table but maybe not ID field directly if not selected?
    // auth.ts: .select('*, labs (name, code)') -> 'assigned_lab_id' is in profiles (user.*) so it's there.

    const labId = user.assigned_lab_id;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Predictive Maintenance</h1>
                    <p className="text-sm text-gray-500">
                        Track calibration schedules and service history.
                    </p>
                </div>
            </div>

            {/* Top: Log Form */}
            <LogMaintenanceForm labId={labId} />

            {/* Alerts Section */}
            {overview?.overdue && overview.overdue.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h2 className="text-red-800 font-bold flex items-center gap-2 mb-3">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        Attention Needed ({overview.overdue.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {overview.overdue.map((item: any) => (
                            <div key={item.id} className="bg-white p-3 rounded shadow-sm border border-red-100">
                                <div className="font-semibold text-gray-900">{item.name}</div>
                                <div className="text-xs text-gray-500">{item.asset_tag}</div>
                                <div className="mt-2 text-red-600 text-sm font-medium">
                                    Due: {new Date(item.next_maintenance_date).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* History Section */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200 font-medium text-gray-700">
                    Recent Service Logs
                </div>
                {!overview?.recentLogs || overview.recentLogs.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No maintenance records found.</div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performed By</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Due</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {overview.recentLogs.map((log: any) => (
                                <tr key={log.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(log.service_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{log.inventory?.name}</div>
                                        <div className="text-xs text-gray-500">{log.inventory?.asset_tag}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="capitalize px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                            {log.maintenance_type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {log.performed_by}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                        {log.next_due_date_set ? new Date(log.next_due_date_set).toLocaleDateString() : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
