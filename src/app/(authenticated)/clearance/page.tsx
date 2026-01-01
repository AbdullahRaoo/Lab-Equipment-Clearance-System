import { getCurrentUser } from '@/app/actions/auth';
import { CreateEquipmentRequestForm } from './CreateEquipmentRequestForm';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ClearancePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  // Only students can create requests
  if (user.role !== 'student') {
    redirect('/requests');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 lg:p-10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">New Equipment Request</h1>
              <p className="text-gray-500 mt-1">Request lab equipment for university projects or home use.</p>
            </div>
            <Link
              href="/requests"
              className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              View My Requests
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Form */}
        <CreateEquipmentRequestForm />
      </div>
    </div>
  );
}
