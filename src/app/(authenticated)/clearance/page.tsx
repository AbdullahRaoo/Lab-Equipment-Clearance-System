import { getCurrentUser } from '@/app/actions/auth';
import { getMyRequests } from '@/app/actions/equipment-request';
import { CreateEquipmentRequestForm } from './CreateEquipmentRequestForm';
import { redirect } from 'next/navigation';
import { STATUS_COLORS, STATUS_LABELS } from '@/types/clearance';

export const dynamic = 'force-dynamic';

export default async function ClearancePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  // Only students can create requests
  if (user.role !== 'student') {
    redirect('/requests');
  }

  const { data: requests } = await getMyRequests();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Equipment Request</h1>
          <p className="text-gray-500 mt-1">Request lab equipment for university projects or home use.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: New Request Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Request Equipment
              </h2>
              <CreateEquipmentRequestForm />
            </div>
          </div>

          {/* Right: Recent History */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Requests</h2>
              <a href="/requests" className="text-sm text-emerald-600 hover:text-emerald-700">
                View all →
              </a>
            </div>

            {!requests || requests.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-gray-500">No equipment requests yet.</p>
                <p className="text-sm text-gray-400 mt-1">Fill out the form to request your first item!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.slice(0, 5).map((req: any) => (
                  <div key={req.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-gray-900">{req.labs?.name || 'Unknown Lab'}</span>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[req.status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-600'}`}>
                            {STATUS_LABELS[req.status as keyof typeof STATUS_LABELS] || req.status}
                          </span>
                          {req.request_type === 'home' && (
                            <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded">Home</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-1">{req.purpose}</p>

                        {req.borrow_request_items?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {req.borrow_request_items.slice(0, 3).map((i: any, idx: number) => (
                              <span key={idx} className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                                {i.inventory?.name}
                              </span>
                            ))}
                            {req.borrow_request_items.length > 3 && (
                              <span className="text-xs text-gray-400">+{req.borrow_request_items.length - 3} more</span>
                            )}
                          </div>
                        )}

                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(req.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>

                      {req.status === 'rejected' && req.rejection_reason && (
                        <div className="ml-4 text-xs text-red-600 max-w-[150px] text-right">
                          {req.rejection_reason}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
