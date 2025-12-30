import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getActiveClearanceRequests, getCrossLabStatistics } from '@/app/actions/clearance';
import { LAB_NAMES, REQUEST_TYPE_LABELS, STATUS_COLORS, LAB_STATUS_COLORS, ClearanceStatus, LabClearanceStatus, ClearanceRequestType } from '@/types/clearance';
import Link from 'next/link';
import { ReviewClearanceButton } from './ReviewClearanceButton';

export default async function AdminClearancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user profile and verify admin access
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', user.id)
    .single();

  if (!profile || !['admin', 'lab_admin'].includes(profile.role)) {
    redirect('/dashboard');
  }

  // Fetch active clearance requests
  const { data: requests } = await getActiveClearanceRequests();

  // Fetch cross-lab statistics
  const { data: stats } = await getCrossLabStatistics();

  // Calculate aggregate stats
  const totalEquipment = stats?.reduce((sum, lab) => sum + lab.total_equipment, 0) || 0;
  const totalBorrowed = stats?.reduce((sum, lab) => sum + lab.borrowed_equipment, 0) || 0;
  const totalIssues = stats?.reduce((sum, lab) => sum + lab.active_issues, 0) || 0;
  const totalFines = stats?.reduce((sum, lab) => sum + lab.total_fines_collected, 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clearance Management</h1>
            <p className="text-gray-600 mt-2">
              Review and manage student clearance requests across all labs
            </p>
          </div>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* System-wide Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Equipment</p>
                <p className="text-2xl font-bold mt-1">{totalEquipment}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Currently Borrowed</p>
                <p className="text-2xl font-bold mt-1">{totalBorrowed}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Issues</p>
                <p className="text-2xl font-bold mt-1">{totalIssues}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Fines</p>
                <p className="text-2xl font-bold mt-1">${totalFines.toFixed(2)}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Lab-wise Statistics */}
        {stats && stats.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Lab Statistics</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-sm">Lab</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Total Equipment</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Available</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Borrowed</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Maintenance</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Active Issues</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Fines Collected</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((lab) => (
                    <tr key={lab.lab_schema} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium">{LAB_NAMES[lab.lab_schema]}</td>
                      <td className="py-3 px-4 text-sm">{lab.total_equipment}</td>
                      <td className="py-3 px-4 text-sm text-green-600">{lab.available_equipment}</td>
                      <td className="py-3 px-4 text-sm text-blue-600">{lab.borrowed_equipment}</td>
                      <td className="py-3 px-4 text-sm text-yellow-600">{lab.in_maintenance_equipment}</td>
                      <td className="py-3 px-4 text-sm text-red-600">{lab.active_issues}</td>
                      <td className="py-3 px-4 text-sm">${lab.total_fines_collected.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Active Clearance Requests */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            Active Clearance Requests ({requests?.length || 0})
          </h2>

          {requests && requests.length > 0 ? (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{request.user_name}</h3>
                      <p className="text-sm text-gray-600">{request.user_email}</p>
                      {request.student_id && (
                        <p className="text-sm text-gray-600">ID: {request.student_id}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[request.status as ClearanceStatus]}`}>
                        {request.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm text-gray-600">Request Type:</p>
                    <p className="text-sm font-medium">{REQUEST_TYPE_LABELS[request.request_type as ClearanceRequestType]}</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                    {(['lab1', 'lab2', 'lab3', 'lab4', 'lab5'] as const).map((lab) => (
                      <div key={lab} className="text-center p-2 border rounded">
                        <p className="text-xs text-gray-600 mb-1">{LAB_NAMES[lab]}</p>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${LAB_STATUS_COLORS[request[`${lab}_status`] as LabClearanceStatus]
                          }`}>
                          {(request[`${lab}_status`] as string).replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t">
                    <div>
                      {request.all_labs_cleared ? (
                        <span className="text-sm text-green-600 font-medium">✓ All labs cleared</span>
                      ) : (
                        <span className="text-sm text-yellow-600 font-medium">⚠ Pending review</span>
                      )}
                    </div>
                    <ReviewClearanceButton requestId={request.id} userId={request.user_id} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No active clearance requests at this time.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
