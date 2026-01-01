import { getCurrentUser } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import { signOut } from '@/app/actions/auth';
import { getInventory, getLabs } from '@/app/actions/inventory';
import { getMyRequests, getAllRequests } from '@/app/actions/equipment-request';
import { getAllUsers } from '@/app/actions/users';
import Link from 'next/link';
import { UserRole, ROLE_LABELS } from '@/types/clearance';

export const dynamic = 'force-dynamic';

// Lab themes for visual variety
const LAB_THEMES: Record<string, { gradient: string; icon: string }> = {
  CNET: { gradient: 'from-blue-500 to-blue-600', icon: '🖥️' },
  DLD: { gradient: 'from-purple-500 to-purple-600', icon: '⚡' },
  EMB: { gradient: 'from-emerald-500 to-emerald-600', icon: '🔧' },
  IOT: { gradient: 'from-orange-500 to-orange-600', icon: '📡' },
  ROBO: { gradient: 'from-pink-500 to-pink-600', icon: '🤖' },
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const role = user.role as UserRole;
  const isStudent = role === 'student';
  const isLabStaff = ['lab_engineer', 'lab_assistant'].includes(role);
  const isAdmin = ['hod', 'pro_hod', 'oic_cen_labs', 'asst_oic_cen_labs'].includes(role);

  // Fetch data
  const { data: labs } = await getLabs();
  const { data: allInventory } = await getInventory();

  // Filter inventory for lab staff
  let inventoryForUser = allInventory;
  if (isLabStaff && user.assigned_lab_id) {
    inventoryForUser = allInventory?.filter(i => i.lab_id === user.assigned_lab_id);
  }

  // Get requests based on role
  let requests: any[] = [];
  if (isStudent) {
    const { data } = await getMyRequests();
    requests = data || [];
  } else {
    const { data } = await getAllRequests();
    requests = data || [];
  }

  // Get users count for admins
  let usersData: any[] = [];
  if (isAdmin) {
    const { data } = await getAllUsers();
    usersData = data || [];
  }

  // Filter labs for lab staff
  let visibleLabs = labs || [];
  if (isLabStaff && user.assigned_lab_id) {
    visibleLabs = labs?.filter(l => l.id === user.assigned_lab_id) || [];
  }

  // Calculate analytics
  const stats = {
    totalEquipment: inventoryForUser?.length || 0,
    availableEquipment: inventoryForUser?.filter(i => i.status === 'available').length || 0,
    borrowedEquipment: inventoryForUser?.filter(i => i.status === 'borrowed').length || 0,
    pendingRequests: requests?.filter(r => r.status === 'pending_lab' || r.status === 'pending_admin' || r.status === 'pending_hod').length || 0,
    approvedRequests: requests?.filter(r => r.status === 'approved').length || 0,
    totalUsers: usersData?.length || 0,
    activeRequests: requests?.filter(r => r.status !== 'completed' && r.status !== 'rejected').length || 0,
  };

  // Calculate equipment by status for the chart
  const equipmentByStatus = [
    { label: 'Available', value: stats.availableEquipment, color: 'bg-green-500' },
    { label: 'Borrowed', value: stats.borrowedEquipment, color: 'bg-blue-500' },
    { label: 'Maintenance', value: inventoryForUser?.filter(i => i.status === 'maintenance').length || 0, color: 'bg-yellow-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header with Gradient */}
      <header className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Welcome back,</p>
              <h1 className="text-3xl font-bold">{user.full_name}</h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                  {ROLE_LABELS[role]}
                </span>
                {user.reg_no && (
                  <span className="text-emerald-100 text-sm">• {user.reg_no}</span>
                )}
              </div>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="px-5 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors border border-white/20"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-bl-full"></div>
            <div className="relative">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 font-medium">Total Equipment</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalEquipment}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-50 rounded-bl-full"></div>
            <div className="relative">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 font-medium">{isStudent ? 'My Requests' : 'Active Requests'}</p>
              <p className="text-3xl font-bold text-gray-900">{stats.activeRequests}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-50 rounded-bl-full"></div>
            <div className="relative">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 font-medium">Pending Approval</p>
              <p className="text-3xl font-bold text-gray-900">{stats.pendingRequests}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-100 to-green-50 rounded-bl-full"></div>
            <div className="relative">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 font-medium">{isAdmin ? 'Total Users' : 'Available'}</p>
              <p className="text-3xl font-bold text-gray-900">{isAdmin ? stats.totalUsers : stats.availableEquipment}</p>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Labs and Charts */}
          <div className="lg:col-span-2 space-y-8">
            {/* Equipment Distribution Chart */}
            {!isStudent && (
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-6">Equipment Status Overview</h2>
                <div className="flex items-center gap-8">
                  {/* Simple visual bar chart */}
                  <div className="flex-1 space-y-4">
                    {equipmentByStatus.map((item, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700">{item.label}</span>
                          <span className="text-gray-500">{item.value} items</span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${item.color} rounded-full transition-all duration-500`}
                            style={{ width: `${stats.totalEquipment > 0 ? (item.value / stats.totalEquipment) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Circular indicator */}
                  <div className="w-32 h-32 relative flex-shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="16" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="16" fill="none" stroke="#10b981" strokeWidth="3"
                        strokeDasharray={`${stats.totalEquipment > 0 ? (stats.availableEquipment / stats.totalEquipment) * 100 : 0} 100`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-gray-900">
                        {stats.totalEquipment > 0 ? Math.round((stats.availableEquipment / stats.totalEquipment) * 100) : 0}%
                      </span>
                      <span className="text-xs text-gray-500">Available</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Lab Cards */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  {isLabStaff ? 'Your Assigned Lab' : 'Laboratories'}
                </h2>
                <Link href="/inventory" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
                  View All →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visibleLabs.map((lab) => {
                  const theme = LAB_THEMES[lab.code] || { gradient: 'from-gray-500 to-gray-600', icon: '🏢' };
                  const labInventory = allInventory?.filter(i => i.lab_id === lab.id) || [];
                  const available = labInventory.filter(i => i.status === 'available').length;

                  return (
                    <Link
                      key={lab.id}
                      href={`/inventory/lab/${lab.code}`}
                      className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-lg hover:border-emerald-200 transition-all duration-300"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-2xl shadow-lg shrink-0`}>
                          {theme.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors truncate">
                              {lab.name}
                            </h3>
                            <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded-full shrink-0 ml-2">
                              {lab.code}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="text-gray-500">{labInventory.length} items</span>
                            <span className="text-green-600 font-medium">{available} available</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Quick Actions & Recent Activity */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                {isStudent && (
                  <>
                    <Link
                      href="/clearance"
                      className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 shadow-lg transition-all"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span className="font-medium">New Equipment Request</span>
                    </Link>
                    <Link
                      href="/requests"
                      className="flex items-center gap-3 p-4 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                      <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span className="font-medium">View My Requests</span>
                    </Link>
                  </>
                )}

                {isLabStaff && (
                  <>
                    <Link
                      href="/inventory/new"
                      className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 shadow-lg transition-all"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span className="font-medium">Add Equipment</span>
                    </Link>
                    <Link
                      href="/requests"
                      className="flex items-center gap-3 p-4 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors border border-blue-200"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span className="font-medium">Review Requests</span>
                    </Link>
                  </>
                )}

                {isAdmin && (
                  <>
                    <Link
                      href="/requests"
                      className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 shadow-lg transition-all"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">Approve Requests</span>
                    </Link>
                    <Link
                      href="/admin/users"
                      className="flex items-center gap-3 p-4 bg-purple-50 text-purple-700 rounded-xl hover:bg-purple-100 transition-colors border border-purple-200"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span className="font-medium">Manage Users</span>
                    </Link>
                    <Link
                      href="/inventory"
                      className="flex items-center gap-3 p-4 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                      <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <span className="font-medium">View All Inventory</span>
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
              <div className="space-y-4">
                {requests.slice(0, 5).map((req: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className={`w-2 h-2 rounded-full ${req.status === 'approved' ? 'bg-green-500' :
                        req.status === 'rejected' ? 'bg-red-500' :
                          req.status.includes('pending') ? 'bg-amber-500' : 'bg-blue-500'
                      }`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        Request #{req.id?.slice(0, 8)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${req.status === 'approved' ? 'bg-green-100 text-green-700' :
                        req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                      }`}>
                      {req.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
                {requests.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
                )}
              </div>
              {requests.length > 0 && (
                <Link href="/requests" className="block mt-4 text-center text-emerald-600 hover:text-emerald-700 text-sm font-medium">
                  View All Requests →
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
