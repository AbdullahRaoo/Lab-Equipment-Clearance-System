import { getCurrentUser } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import { signOut } from '@/app/actions/auth';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Equipment Clearance Management System
          </h1>
          <form action={signOut}>
            <button
              type="submit"
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Sign Out
            </button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">
            Welcome, {user.full_name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Role</p>
              <p className="font-medium capitalize">{user.role.replace('_', ' ')}</p>
            </div>
            {user.department && (
              <div>
                <p className="text-sm text-gray-600">Department</p>
                <p className="font-medium">{user.department}</p>
              </div>
            )}
            {user.student_id && (
              <div>
                <p className="text-sm text-gray-600">Student ID</p>
                <p className="font-medium">{user.student_id}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Assigned Labs</p>
              <p className="font-medium">
                {user.assigned_labs.length > 0 
                  ? user.assigned_labs.join(', ') 
                  : 'None'}
              </p>
            </div>
          </div>
        </div>

        {/* Lab Access */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Laboratory Access</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Link
              href="/labs/lab1"
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-center"
            >
              <div className="text-2xl mb-2">🔬</div>
              <p className="font-medium">Lab 1</p>
            </Link>
            <Link
              href="/labs/lab2"
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-center"
            >
              <div className="text-2xl mb-2">⚗️</div>
              <p className="font-medium">Lab 2</p>
            </Link>
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 text-center opacity-50">
              <div className="text-2xl mb-2">🧪</div>
              <p className="font-medium">Lab 3</p>
              <p className="text-xs text-gray-500">Coming Soon</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 text-center opacity-50">
              <div className="text-2xl mb-2">🔧</div>
              <p className="font-medium">Lab 4</p>
              <p className="text-xs text-gray-500">Coming Soon</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 text-center opacity-50">
              <div className="text-2xl mb-2">💻</div>
              <p className="font-medium">Lab 5</p>
              <p className="text-xs text-gray-500">Coming Soon</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">My Equipment</h3>
            <p className="text-gray-600 text-sm mb-4">
              View equipment you've borrowed across all labs
            </p>
            <Link
              href="/labs/lab1"
              className="block w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-center"
            >
              View Equipment
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Clearance Status</h3>
            <p className="text-gray-600 text-sm mb-4">
              Check your clearance status
            </p>
            <button className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
              Check Status
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Submit Request</h3>
            <p className="text-gray-600 text-sm mb-4">
              Request clearance certificate
            </p>
            <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
              New Request
            </button>
          </div>
        </div>

        {/* Role-specific sections */}
        {(user.role === 'admin' || user.role === 'lab_admin') && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Admin Functions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.role === 'admin' && (
                <>
                  <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50">
                    Manage Users
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50">
                    View Audit Logs
                  </button>
                </>
              )}
              <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50">
                Manage Inventory
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50">
                Review Requests
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
