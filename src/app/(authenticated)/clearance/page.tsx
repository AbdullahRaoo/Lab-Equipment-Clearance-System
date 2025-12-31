import { getCurrentUser } from '@/app/actions/auth';
import { getMyBorrowRequests } from '@/app/actions/borrow';
import { CreateBorrowRequestForm } from './CreateBorrowRequestForm';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function ClearancePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { data: requests } = await getMyBorrowRequests();

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipment Requests</h1>
          <p className="text-sm text-gray-500">Borrow equipment for university projects or home use.</p>
        </div>

        {/* Toggle to Graduation Clearance (Future) */}
        <Link href="/clearance/certificate" className="text-sm text-[#105a4b] hover:underline">
          Need Graduation No-Dues Certificate?
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: New Request Form */}
        <div className="lg:col-span-1">
          <CreateBorrowRequestForm />
        </div>

        {/* Right: History */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Request History</h2>

          {!requests || requests.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-500">You haven't requested any equipment yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req: any) => (
                <div key={req.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">{req.labs?.name || 'Unknown Lab'}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize 
                                        ${req.status === 'approved' ? 'bg-green-100 text-green-800' :
                          req.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {req.status}
                      </span>
                      <span className="text-xs text-gray-500 border px-1 rounded">{req.request_type}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{req.purpose}</p>

                    {req.borrow_request_items?.length > 0 && (
                      <div className="text-sm text-gray-500">
                        Members: {req.borrow_request_items.map((i: any) => i.inventory?.name).join(', ')}
                      </div>
                    )}

                    <div className="text-xs text-gray-400 mt-2">
                      {new Date(req.start_time).toLocaleDateString()} - {new Date(req.end_time).toLocaleDateString()}
                    </div>
                  </div>

                  {req.rejection_reason && (
                    <div className="text-xs text-red-600 max-w-xs text-right">
                      Reason: {req.rejection_reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
