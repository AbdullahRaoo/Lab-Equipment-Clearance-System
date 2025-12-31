'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClearanceRequest } from '@/app/actions/clearance';
import { ClearanceRequestType, REQUEST_TYPE_LABELS } from '@/types/clearance';

export function CreateClearanceRequestForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestType, setRequestType] = useState<ClearanceRequestType>('graduation');
  const [reason, setReason] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const result = await createClearanceRequest(requestType, reason || undefined);
      
      if (result.error) {
        setError(result.error);
      } else {
        // Refresh the page to show the new request
        router.refresh();
      }
    } catch (err) {
      setError('Failed to create clearance request');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div>
        <label htmlFor="requestType" className="block text-sm font-medium text-gray-700 mb-2">
          Request Type <span className="text-red-500">*</span>
        </label>
        <select
          id="requestType"
          value={requestType}
          onChange={(e) => setRequestType(e.target.value as ClearanceRequestType)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          {(Object.keys(REQUEST_TYPE_LABELS) as ClearanceRequestType[]).map((type) => (
            <option key={type} value={type}>
              {REQUEST_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
          Reason (Optional)
        </label>
        <textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Provide additional details about your clearance request..."
        />
      </div>
      
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating Request...' : 'Submit Clearance Request'}
        </button>
      </div>
    </form>
  );
}
