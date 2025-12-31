import Link from 'next/link';
import { LAB_NAMES } from '@/types/clearance';

interface StudentDashboardProps {
    user: any;
}

export function StudentDashboard({ user }: StudentDashboardProps) {
    return (
        <div className="space-y-6">
            {/* Welcome & Status Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Welcome, {user.full_name}</h2>
                        <p className="text-gray-500 mt-1">Student ID: {user.student_id || 'N/A'}</p>
                    </div>
                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                        Student Portal
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    {/* Active Loans Card */}
                    <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                        <h3 className="font-semibold text-blue-900">My Equipment</h3>
                        <p className="text-sm text-blue-700 mt-1">View currently borrowed items</p>
                        <Link
                            href="/clearance"
                            className="mt-4 inline-block text-sm font-medium text-blue-700 hover:text-blue-800"
                        >
                            View Active Loans →
                        </Link>
                    </div>

                    {/* Clearance Status Card */}
                    <div className="bg-green-50/50 p-4 rounded-lg border border-green-100">
                        <h3 className="font-semibold text-green-900">Clearance Status</h3>
                        <p className="text-sm text-green-700 mt-1">Check eligibility & certificate</p>
                        <Link
                            href="/clearance"
                            className="mt-4 inline-block text-sm font-medium text-green-700 hover:text-green-800"
                        >
                            Check Status →
                        </Link>
                    </div>

                    {/* Issues Card */}
                    <div className="bg-red-50/50 p-4 rounded-lg border border-red-100">
                        <h3 className="font-semibold text-red-900">Report Issue</h3>
                        <p className="text-sm text-red-700 mt-1">Report lost/damage equipment</p>
                        <Link
                            href="/clearance"
                            className="mt-4 inline-block text-sm font-medium text-red-700 hover:text-red-800"
                        >
                            View/Report Issues →
                        </Link>
                    </div>
                </div>
            </div>

            {/* Lab Browser Section */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Browse Laboratories</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(Object.entries(LAB_NAMES) as [string, string][]).map(([key, name]) => (
                        <Link
                            key={key}
                            href={`/labs/${key}`}
                            className="group bg-white p-5 rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all duration-200"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{key.replace('lab', 'Lab ')}</span>
                                <svg className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                            <h4 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">
                                {name}
                            </h4>
                            <p className="text-sm text-gray-500 mt-1">View inventory & check availability</p>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
