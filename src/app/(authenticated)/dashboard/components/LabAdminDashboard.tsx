import Link from 'next/link';

interface LabAdminDashboardProps {
    user: any;
}

export function LabAdminDashboard({ user }: LabAdminDashboardProps) {
    const assignedLab = user.labs;

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Lab Administration</h2>
                        <p className="text-gray-500 mt-1">Manage inventory and clearance for {assignedLab ? assignedLab.name : 'your assigned lab'}</p>
                    </div>
                    <span className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
                        Lab Incharge
                    </span>
                </div>

                <div className="mt-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Link
                            href="/admin/clearance"
                            className="bg-purple-50 p-6 rounded-lg border border-purple-100 hover:border-purple-300 transition-colors"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-gray-900">Clearance Requests</h3>
                            </div>
                            <p className="text-sm text-gray-600">Review pending clearance requests</p>
                        </Link>

                        <Link
                            href="/inventory"
                            className="bg-blue-50 p-6 rounded-lg border border-blue-100 hover:border-blue-300 transition-colors"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-gray-900">Manage Inventory</h3>
                            </div>
                            <p className="text-sm text-gray-600">Add or edit equipment in {assignedLab?.code || 'Lab'}</p>
                        </Link>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">My Assigned Lab</h3>
                {!assignedLab ? (
                    <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 text-yellow-800">
                        You have not been assigned to a lab yet. Please contact the HOD to get assigned to a lab.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Link
                            href={`/inventory`}
                            className="group bg-white p-5 rounded-lg border border-gray-200 hover:border-orange-500 hover:shadow-md transition-all duration-200"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    {assignedLab.code}
                                </span>
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                                    Authorized
                                </span>
                            </div>
                            <h4 className="font-bold text-gray-900 text-lg group-hover:text-orange-600 transition-colors">
                                {assignedLab.name}
                            </h4>
                            <p className="text-sm text-gray-500 mt-1">Manage inventory & issues</p>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
