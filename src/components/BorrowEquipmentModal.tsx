'use client';

import { useState } from 'react';
import { borrowEquipment } from '@/app/actions/lab';
import type { Equipment, LabSchema } from '@/types/lab';

interface BorrowEquipmentModalProps {
    equipment: Equipment;
    labSchema: LabSchema;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function BorrowEquipmentModal({
    equipment,
    labSchema,
    isOpen,
    onClose,
    onSuccess
}: BorrowEquipmentModalProps) {
    const [expectedReturnDate, setExpectedReturnDate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get minimum date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];

    // Get maximum date (30 days from now)
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    const maxDateStr = maxDate.toISOString().split('T')[0];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const result = await borrowEquipment(labSchema, equipment.id, expectedReturnDate);

            if (result.error) {
                setError(result.error);
            } else {
                onSuccess?.();
                onClose();
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Borrow Equipment</h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {/* Equipment Info */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Equipment</p>
                        <p className="font-semibold text-gray-900">{equipment.equipment_name}</p>
                        <p className="text-sm text-gray-500">{equipment.equipment_code}</p>
                        <div className="mt-2 flex gap-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                {equipment.category}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${equipment.condition === 'excellent' ? 'bg-green-100 text-green-800' :
                                    equipment.condition === 'good' ? 'bg-green-100 text-green-800' :
                                        equipment.condition === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                }`}>
                                {equipment.condition}
                            </span>
                        </div>
                    </div>

                    {/* Expected Return Date */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Expected Return Date *
                        </label>
                        <input
                            type="date"
                            required
                            min={minDate}
                            max={maxDateStr}
                            value={expectedReturnDate}
                            onChange={(e) => setExpectedReturnDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Maximum borrowing period is 30 days
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !expectedReturnDate}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Processing...' : 'Confirm Borrow'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
