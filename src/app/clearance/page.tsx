import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { 
  getUserLatestClearanceRequest, 
  checkUserClearanceEligibility,
  getAllUserBorrowedEquipment,
  getAllUserUnpaidIssues
} from '@/app/actions/clearance';
import { LAB_NAMES, REQUEST_TYPE_LABELS, STATUS_COLORS, LAB_STATUS_COLORS } from '@/types/clearance';
import { CreateClearanceRequestForm } from './CreateClearanceRequestForm';

export default async function ClearancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }
  
  // Get user profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', user.id)
    .single();
  
  if (!profile) {
    redirect('/login');
  }
  
  // Fetch latest clearance request
  const { data: latestRequest } = await getUserLatestClearanceRequest();
  
  // Fetch eligibility status
  const { data: eligibility } = await checkUserClearanceEligibility();
  
  // Fetch borrowed equipment
  const { data: borrowedEquipment } = await getAllUserBorrowedEquipment();
  
  // Fetch unpaid issues
  const { data: unpaidIssues } = await getAllUserUnpaidIssues();
  
  // Calculate summary
  const totalBorrowed = borrowedEquipment?.length || 0;
  const totalUnpaid = unpaidIssues?.reduce((sum, issue) => sum + issue.total_amount, 0) || 0;
  const hasBlockingIssues = eligibility?.some(e => !e.is_eligible) || false;
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Equipment Clearance</h1>
          <p className="text-gray-600 mt-2">
            Request and track your equipment clearance status across all labs
          </p>
        </div>
        
        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Your Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-medium">{profile.full_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{profile.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Student ID</p>
              <p className="font-medium">{profile.student_id || 'N/A'}</p>
            </div>
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Borrowed Equipment</p>
                <p className="text-2xl font-bold mt-1">{totalBorrowed}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Unpaid Fines</p>
                <p className="text-2xl font-bold mt-1">${totalUnpaid.toFixed(2)}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Clearance Status</p>
                <p className="text-2xl font-bold mt-1">
                  {hasBlockingIssues ? (
                    <span className="text-red-600">Issues Found</span>
                  ) : (
                    <span className="text-green-600">Eligible</span>
                  )}
                </p>
              </div>
              <div className={`p-3 rounded-full ${hasBlockingIssues ? 'bg-red-100' : 'bg-green-100'}`}>
                <svg className={`w-6 h-6 ${hasBlockingIssues ? 'text-red-600' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={hasBlockingIssues ? "M6 18L18 6M6 6l12 12" : "M5 13l4 4L19 7"} />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        {/* Lab-wise Eligibility Status */}
        {eligibility && eligibility.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Lab-wise Clearance Status</h2>
            <div className="space-y-4">
              {eligibility.map((lab) => (
                <div key={lab.lab_schema} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{LAB_NAMES[lab.lab_schema]}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      lab.is_eligible ? LAB_STATUS_COLORS.cleared : LAB_STATUS_COLORS.issues_found
                    }`}>
                      {lab.is_eligible ? 'Cleared' : 'Issues Found'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Borrowed</p>
                      <p className="font-medium">{lab.borrowed_equipment_count}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Overdue</p>
                      <p className="font-medium text-red-600">{lab.overdue_returns_count}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Unpaid Issues</p>
                      <p className="font-medium">{lab.unpaid_issues_count}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Fines</p>
                      <p className="font-medium">${lab.total_unpaid_amount.toFixed(2)}</p>
                    </div>
                  </div>
                  
                  {lab.issues && lab.issues.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm font-medium text-red-600 mb-1">Issues:</p>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {lab.issues.map((issue, idx) => (
                          <li key={idx}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Latest Clearance Request */}
        {latestRequest && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Current Clearance Request</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Request Type</p>
                  <p className="font-medium">{REQUEST_TYPE_LABELS[latestRequest.request_type]}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[latestRequest.status]}`}>
                  {latestRequest.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Created</p>
                  <p className="font-medium">{new Date(latestRequest.created_at).toLocaleDateString()}</p>
                </div>
                {latestRequest.valid_until && (
                  <div>
                    <p className="text-gray-600">Valid Until</p>
                    <p className="font-medium">{new Date(latestRequest.valid_until).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
              
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Lab Status:</p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {(['lab1', 'lab2', 'lab3', 'lab4', 'lab5'] as const).map((lab) => (
                    <div key={lab} className="text-center">
                      <p className="text-xs text-gray-600 mb-1">{LAB_NAMES[lab]}</p>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        LAB_STATUS_COLORS[latestRequest[`${lab}_status`]]
                      }`}>
                        {latestRequest[`${lab}_status`].replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Borrowed Equipment Details */}
        {borrowedEquipment && borrowedEquipment.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Borrowed Equipment</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-sm">Lab</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Equipment</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Category</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Borrowed</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Due Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {borrowedEquipment.map((item, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">{LAB_NAMES[item.lab_schema]}</td>
                      <td className="py-3 px-4 text-sm">{item.equipment_name}</td>
                      <td className="py-3 px-4 text-sm">{item.category}</td>
                      <td className="py-3 px-4 text-sm">{new Date(item.borrowed_at).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-sm">{new Date(item.due_date).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-sm">
                        {item.is_overdue ? (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                            Overdue ({item.days_overdue} days)
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                            Active
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Unpaid Issues Details */}
        {unpaidIssues && unpaidIssues.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Unpaid Issues & Fines</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-sm">Lab</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Description</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Severity</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Reported</th>
                  </tr>
                </thead>
                <tbody>
                  {unpaidIssues.map((issue, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">{LAB_NAMES[issue.lab_schema]}</td>
                      <td className="py-3 px-4 text-sm">{issue.issue_type}</td>
                      <td className="py-3 px-4 text-sm">{issue.description}</td>
                      <td className="py-3 px-4 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          issue.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          issue.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                          issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {issue.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm font-medium">${issue.total_amount.toFixed(2)}</td>
                      <td className="py-3 px-4 text-sm">{new Date(issue.reported_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Create New Request Form */}
        {(!latestRequest || ['approved', 'rejected'].includes(latestRequest.status)) && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Request New Clearance</h2>
            {hasBlockingIssues ? (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      You have outstanding issues that must be resolved before clearance can be approved. 
                      Please return all borrowed equipment and pay any outstanding fines.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
            <CreateClearanceRequestForm />
          </div>
        )}
      </div>
    </div>
  );
}
