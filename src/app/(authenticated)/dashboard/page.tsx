import { getCurrentUser } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import { signOut } from '@/app/actions/auth';
import { StudentDashboard } from './components/StudentDashboard';
import { LabAdminDashboard } from './components/LabAdminDashboard';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Role-based rendering
  const renderDashboard = () => {
    switch (user.role) {
      case 'admin':
        return <SuperAdminDashboard user={user} />;
      case 'lab_admin':
        return <LabAdminDashboard user={user} />;
      case 'student':
      default:
        return <StudentDashboard user={user} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold">
              EC
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Lab Clearance System
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role.replace('_', ' ')}</p>
            </div>

            <form action={signOut}>
              <button
                type="submit"
                className="px-4 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 hover:text-red-600 transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderDashboard()}
      </main>
    </div>
  );
}
