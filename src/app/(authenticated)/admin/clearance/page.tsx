import { getCurrentUser } from '@/app/actions/auth';
import { getLabPendingRequests } from '@/app/actions/borrow';
import { redirect } from 'next/navigation';
import { RequestActionButtons } from './RequestActionButtons';

export default async function AdminClearancePage() {
  const user = await getCurrentUser();
  if (!user || user.role === 'student') redirect('/dashboard');

  let requests: any[] = [];
  let errorMsg = '';

  // Get queries based on role
  if (user.role === 'lab_incharge' || user.role === 'lab_assistant') {
    if (user.assigned_lab_id) {
      const { data, error } = await getLabPendingRequests(user.assigned_lab_id);
      if (data) requests = data;
      if (error) errorMsg = error;
    } else {
      errorMsg = 'You are not assigned to any lab.';
    }
  } else if (user.role === 'hod' || user.role === 'pro_hod') {
    errorMsg = 'HOD View: All Lab Request Aggregation is currently under development. To review requests, please switch to specific Lab Admin view or use the global audit log.';
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Equipment Requests</h1>
          <p className="text-sm text-gray-500">Manage borrowing requests for your laboratory.</p>
        </div>
        <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-semibold uppercase">
          {user.labs?.name || 'All Labs'}
        </span>
      </div>

      {errorMsg && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200">
          {errorMsg}
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {requests.length === 0 ? (
            <li className="p-12 text-center text-gray-500 bg-gray-50">
              <p>No pending requests found for this lab.</p>
              <p className="text-xs mt-2">Check back later.</p>
            </li>
          ) : (
            requests.map((req) => (
              <li key={req.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-medium text-gray-900">{req.profiles?.full_name}</h3>
                      <span className="text-sm text-gray-500 font-mono bg-gray-100 px-1 rounded">
                        {req.profiles?.reg_no || 'No Reg'}
                      </span>
                      {req.profiles?.reliability_score !== null && (
                        <span className={`text-xs px-2 py-0.5 rounded border font-medium
                                            ${req.profiles.reliability_score < 50 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                          Reliability: {req.profiles.reliability_score}%
                        </span>
                      )}
                    </div>
                    <p className="text-gray-800 font-medium">Purpose: <span className="font-normal italic text-gray-600">{req.purpose}</span></p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-3 bg-gray-50 p-3 rounded-md border border-gray-100">
                      <div>
                        <span className="font-semibold text-gray-700 block mb-1">Type</span>
                        <span className={`px-2 py-0.5 rounded text-xs uppercase font-bold 
                                            ${req.request_type === 'home' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {req.request_type === 'home' ? 'Take Home' : 'In Lab'}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700 block mb-1">Duration</span>
                        <div className="flex flex-col text-xs text-gray-600">
                          <span>From: {new Date(req.start_time).toLocaleString()}</span>
                          <span>To: {new Date(req.end_time).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="font-semibold text-gray-700 block mb-1">
                          Requested Items ({req.borrow_request_items?.length || 0})
                        </span>
                        <ul className="list-disc pl-5 space-y-1">
                          {req.borrow_request_items?.map((item: any) => (
                            <li key={item.id}>
                              <span className="text-gray-900 font-medium">{item.inventory?.name}</span>
                              {item.inventory?.asset_tag && (
                                <span className="text-xs text-gray-500 ml-2">[{item.inventory.asset_tag}]</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {req.is_group_project && req.group_members && (
                        <div className="sm:col-span-2">
                          <span className="font-semibold text-gray-700 block mb-1">Group Members</span>
                          <p className="text-xs text-gray-600">{req.group_members.join(', ')}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 min-w-[120px]">
                    <span className="text-xs text-gray-500 mb-1">
                      Created: {new Date(req.created_at).toLocaleDateString()}
                    </span>
                    <RequestActionButtons requestId={req.id} />
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
