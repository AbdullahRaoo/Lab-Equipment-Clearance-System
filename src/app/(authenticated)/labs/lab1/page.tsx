import { getCurrentUser } from '@/app/actions/auth';
import { getLabInventory, getLabIssues } from '@/app/actions/lab';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function Lab1Page() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const { data: inventory, error: invError } = await getLabInventory('lab1');
  const { data: issues, error: issuesError } = await getLabIssues('lab1');

  const stats = {
    total: inventory?.length || 0,
    available: inventory?.filter((item) => item.status === 'available').length || 0,
    borrowed: inventory?.filter((item) => item.status === 'borrowed').length || 0,
    maintenance: inventory?.filter((item) => item.status === 'maintenance').length || 0,
  };

  const openIssues = issues?.filter((issue) => issue.status === 'open').length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 text-sm mb-2 block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Lab 1 - Inventory Management</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Total Equipment</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Available</p>
            <p className="text-3xl font-bold text-green-600">{stats.available}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Borrowed</p>
            <p className="text-3xl font-bold text-blue-600">{stats.borrowed}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Open Issues</p>
            <p className="text-3xl font-bold text-red-600">{openIssues}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/labs/lab1/inventory"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-lg font-semibold mb-2">View Inventory</h3>
            <p className="text-gray-600 text-sm">Browse all equipment in Lab 1</p>
          </Link>

          <Link
            href="/labs/lab1/issues"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-lg font-semibold mb-2">View Issues</h3>
            <p className="text-gray-600 text-sm">Check reported equipment issues</p>
          </Link>

          <Link
            href="/labs/lab1/returns"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-lg font-semibold mb-2">View Returns</h3>
            <p className="text-gray-600 text-sm">Manage equipment returns</p>
          </Link>
        </div>

        {/* Recent Equipment */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Recent Equipment</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equipment Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Condition
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventory && inventory.slice(0, 10).map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.equipment_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.equipment_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${item.status === 'available' ? 'bg-green-100 text-green-800' : ''}
                          ${item.status === 'borrowed' ? 'bg-blue-100 text-blue-800' : ''}
                          ${item.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${item.status === 'damaged' ? 'bg-red-100 text-red-800' : ''}
                        `}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.condition}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
