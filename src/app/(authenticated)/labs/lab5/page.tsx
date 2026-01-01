export const dynamic = 'force-dynamic';

import { getCurrentUser } from '@/app/actions/auth';
import { getInventory, getLabs } from '@/app/actions/inventory';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LabEquipmentTable } from '@/components/LabEquipmentTable';
import { UserRole } from '@/types/clearance';

async function LabPage({ labCode, labName }: { labCode: string; labName: string }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const role = user.role as UserRole;
  const { data: labs } = await getLabs();
  const lab = labs?.find(l => l.code === labCode);

  if (!lab) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Lab Not Found</h1>
          <p className="text-gray-500">The lab "{labCode}" doesn't exist.</p>
          <Link href="/dashboard" className="mt-4 inline-block text-emerald-600">← Back</Link>
        </div>
      </div>
    );
  }

  const isAdmin = ['hod', 'pro_hod', 'oic_cen_labs', 'asst_oic_cen_labs'].includes(role);
  const isLabStaff = ['lab_engineer', 'lab_assistant'].includes(role);
  const canEdit = isAdmin || (isLabStaff && user.assigned_lab_id === lab.id);

  const { data: inventory } = await getInventory(lab.id);
  const stats = {
    total: inventory?.length || 0,
    available: inventory?.filter(item => item.status === 'available').length || 0,
    borrowed: inventory?.filter(item => item.status === 'borrowed').length || 0,
    maintenance: inventory?.filter(item => item.status === 'maintenance').length || 0,
  };
  const isStudent = role === 'student';

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <Link href="/dashboard" className="text-emerald-600 hover:text-emerald-800 text-sm mb-2 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">{labName}</h1>
              <p className="text-sm text-gray-500">Lab Code: {labCode}</p>
            </div>
            {isStudent && (
              <Link href={`/clearance?lab=${lab.id}`} className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg shadow-lg flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Request
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Total</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Available</p>
            <p className="text-3xl font-bold text-green-600">{stats.available}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Borrowed</p>
            <p className="text-3xl font-bold text-blue-600">{stats.borrowed}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Maintenance</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.maintenance}</p>
          </div>
        </div>
        <LabEquipmentTable inventory={inventory || []} labId={lab.id} labCode={labCode} userRole={role} canEdit={canEdit} />
      </main>
    </div>
  );
}

export default async function Lab5Page() {
  return <LabPage labCode="ROBO" labName="Robotic Lab" />;
}
