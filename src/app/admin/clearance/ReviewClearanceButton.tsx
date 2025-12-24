'use client';

import { useRouter } from 'next/navigation';

interface ReviewClearanceButtonProps {
  requestId: string;
  userId: string;
}

export function ReviewClearanceButton({ requestId, userId }: ReviewClearanceButtonProps) {
  const router = useRouter();
  
  const handleReview = () => {
    router.push(`/admin/clearance/${requestId}`);
  };
  
  return (
    <button
      onClick={handleReview}
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
    >
      Review Details
    </button>
  );
}
