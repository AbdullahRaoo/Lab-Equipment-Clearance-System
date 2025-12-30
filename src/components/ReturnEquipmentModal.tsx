'use client';

import { useState } from 'react';
import { returnEquipment } from '@/app/actions/lab';
import type { Return, LabSchema, EquipmentCondition } from '@/types/lab';

interface ReturnEquipmentModalProps {
    returnRecord: Return & { equipment_name?: string; equipment_code?: string };
    labSchema: LabSchema;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const CONDITIONS: { value: EquipmentCondition; label: string; description: string }[] = [
    { value: 'excellent', label: 'Excellent', description: 'Like new, no visible wear' },
    { value: 'good', label: 'Good', description: 'Minor wear, fully functional' },
    { value: 'fair', label: 'Fair', description: 'Visible wear, may need maintenance' },
    { value: 'poor', label: 'Poor', description: 'Significant wear or minor issues' },
    { value: 'damaged', label: 'Damaged', description: 'Not functional or major damage' },
];

export function ReturnEquipmentModal({
    returnRecord,
    labSchema,
    isOpen,
    onClose,
    onSuccess
}: ReturnEquipmentModalProps) {
    const [condition, setCondition] = useState<EquipmentCondition>('good');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const result = await returnEquipment(labSchema, returnRecord.id, condition, notes);

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

    // Calculate if overdue
    const isOverdue = new Date(returnRecord.expected_return_date) < new Date();
    const daysOverdue = isOverdue
        ? Math.floor((Date.now() - new Date(returnRecord.expected_return_date).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Return Equipment</h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    {/* Equipment Info */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Equipment</p>
                        <p className="font-semibold text-gray-900">{returnRecord.equipment_name || 'Equipment'}</p>
                        <p className="text-sm text-gray-500">{returnRecord.equipment_code}</p>

                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <p className="text-gray-500">Borrowed</p>
                                <p className="font-medium">{new Date(returnRecord.borrowed_date).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Due Date</p>
                                <p className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                                    {new Date(returnRecord.expected_return_date).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        {isOverdue && (
                            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                                ⚠️ This item is {daysOverdue} day(s) overdue. A late fee may apply.
                            </div>
                        )}
                    </div>

                    {/* Condition Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Equipment Condition *
                        </label>
                        <div className="space-y-2">
                            {CONDITIONS.map((cond) => (
                                <label
                                    key={cond.value}
                                    className={`flex items-start p-3 border rounded-lg cursor-pointer transition-all ${condition === cond.value
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="condition"
                                        value={cond.value}
                                        checked={condition === cond.value}
                                        onChange={() => setCondition(cond.value)}
                                        className="mt-0.5 mr-3"
                                    />
                                    <div>
                                        <p className="font-medium text-gray-900">{cond.label}</p>
                                        <p className="text-sm text-gray-500">{cond.description}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Return Notes (Optional)
                        </label>
                        <textarea
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Any additional notes about the return..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Warning for damaged */}
                    {condition === 'damaged' && (
                        <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 text-sm">
                            Returning equipment as damaged may result in additional fees.
                        </div>
                    )}

                    {/* Error */}
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
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Processing...' : 'Confirm Return'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
