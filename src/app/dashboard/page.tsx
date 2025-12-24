import { getCurrentUser } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import { signOut } from '@/app/actions/auth';
import Link from 'next/link';

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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">My Equipment</h3>
            <p className="text-gray-600 text-sm mb-4">
              View equipment you've borrowed
            </p>
            <Link 
              href="/clearance"
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
            <Link 
              href="/clearance"
              className="block w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-center"
            >
              Check Status
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Submit Request</h3>
            <p className="text-gray-600 text-sm mb-4">
              Request clearance certificate
            </p>
            <Link 
              href="/clearance"
              className="block w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-center"
            >
              New Request
            </Link>
          </div>
        </div>

        {/* Lab Access */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Laboratory Access</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/labs/lab1"
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
            >
              <h4 className="font-semibold text-gray-900 mb-1">Lab 1</h4>
              <p className="text-sm text-gray-600">Electronics & Instrumentation</p>
            </Link>
            <Link
              href="/labs/lab2"
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
            >
              <h4 className="font-semibold text-gray-900 mb-1">Lab 2</h4>
              <p className="text-sm text-gray-600">Mixed Equipment Lab</p>
            </Link>
            <Link
              href="/labs/lab3"
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
            >
              <h4 className="font-semibold text-gray-900 mb-1">Lab 3</h4>
              <p className="text-sm text-gray-600">Biology & Chemistry</p>
            </Link>
            <Link
              href="/labs/lab4"
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
            >
              <h4 className="font-semibold text-gray-900 mb-1">Lab 4</h4>
              <p className="text-sm text-gray-600">Physics & Electronics</p>
            </Link>
            <Link
              href="/labs/lab5"
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
            >
              <h4 className="font-semibold text-gray-900 mb-1">Lab 5</h4>
              <p className="text-sm text-gray-600">Computer & Networking</p>
            </Link>
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
              <Link 
                href="/admin/clearance"
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 text-center"
              >
                Review Clearance Requests
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
