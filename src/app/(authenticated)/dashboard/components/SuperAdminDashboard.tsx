import Link from 'next/link';

// Static list for display until we pass labs prop
const STATIC_LABS = [
    { code: 'ROBO', name: 'Robotic Lab' },
    { code: 'DLD', name: 'DLD Lab' },
    { code: 'IOT', name: 'IOT Lab' },
    { code: 'EMB', name: 'Embedded Design Lab' },
    { code: 'CNET', name: 'Computer & Network Lab' }
];

interface SuperAdminDashboardProps {
    user: any;
}

export function SuperAdminDashboard({ user }: SuperAdminDashboardProps) {
    return (
        <div className="space-y-6">
            <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-800 p-6 text-white">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold">System Command Center</h2>
                        <p className="text-gray-400 mt-1">Global oversight of all labs and users</p>
                    </div>
                    <span className="bg-purple-900/50 text-purple-200 px-3 py-1 rounded-full text-sm font-medium border border-purple-700">
                        Super Admin
                    </span>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Link
                        href="/admin/clearance"
                        className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-blue-500 hover:bg-gray-750 transition-all"
                    >
                        <h3 className="text-lg font-semibold text-blue-400">Review Requests</h3>
                        <p className="text-sm text-gray-400 mt-1">Approve borrow requests</p>
                    </Link>

                    <button className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-green-500 hover:bg-gray-750 transition-all text-left">
                        <h3 className="text-lg font-semibold text-green-400">User Management</h3>
                        <p className="text-sm text-gray-400 mt-1">Assign roles & lab access</p>
                    </button>

                    <button className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-orange-500 hover:bg-gray-750 transition-all text-left">
                        <h3 className="text-lg font-semibold text-orange-400">System Logs</h3>
                        <p className="text-sm text-gray-400 mt-1">View audit trail & security</p>
                    </button>

                    <Link
                        href="/procurement"
                        className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-yellow-500 hover:bg-gray-750 transition-all"
                    >
                        <h3 className="text-lg font-semibold text-yellow-400">Procurement</h3>
                        <p className="text-sm text-gray-400 mt-1">Manage new purchase requests</p>
                    </Link>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">All Laboratories</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {STATIC_LABS.map((lab) => (
                        <Link
                            key={lab.code}
                            href={`/inventory?lab=${lab.code}`}
                            className="group bg-white p-5 rounded-lg border border-gray-200 hover:border-gray-900 hover:shadow-md transition-all duration-200"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{lab.code}</span>
                                <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                                    Admin Access
                                </span>
                            </div>
                            <h4 className="font-bold text-gray-900 text-lg group-hover:text-gray-900 transition-colors">
                                {lab.name}
                            </h4>
                            <p className="text-sm text-gray-500 mt-1">Full inventory control</p>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
