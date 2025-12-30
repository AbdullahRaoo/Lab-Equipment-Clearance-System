'use client';

import { useState } from 'react';
import { createIssue } from '@/app/actions/lab';
import type { Equipment, LabSchema, IssueType, IssueSeverity } from '@/types/lab';

interface ReportIssueFormProps {
    equipment: Equipment;
    labSchema: LabSchema;
    onSuccess?: () => void;
    onCancel?: () => void;
}

const ISSUE_TYPES: { value: IssueType; label: string }[] = [
    { value: 'damage', label: 'Physical Damage' },
    { value: 'malfunction', label: 'Malfunction' },
    { value: 'lost', label: 'Lost/Missing' },
    { value: 'other', label: 'Other' },
];

const SEVERITY_LEVELS: { value: IssueSeverity; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: 'bg-blue-100 text-blue-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' },
];

export function ReportIssueForm({
    equipment,
    labSchema,
    onSuccess,
    onCancel
}: ReportIssueFormProps) {
    const [issueType, setIssueType] = useState<IssueType>('malfunction');
    const [severity, setSeverity] = useState<IssueSeverity>('medium');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const result = await createIssue(
                labSchema,
                equipment.id,
                issueType,
                severity,
                title,
                description
            );

            if (result.error) {
                setError(result.error);
            } else {
                onSuccess?.();
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Report Issue</h2>

            {/* Equipment Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Equipment</p>
                <p className="font-semibold text-gray-900">{equipment.equipment_name}</p>
                <p className="text-sm text-gray-500">{equipment.equipment_code}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Issue Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Issue Type *
                    </label>
                    <select
                        value={issueType}
                        onChange={(e) => setIssueType(e.target.value as IssueType)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {ISSUE_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Severity */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Severity *
                    </label>
                    <div className="flex gap-2">
                        {SEVERITY_LEVELS.map((level) => (
                            <button
                                key={level.value}
                                type="button"
                                onClick={() => setSeverity(level.value)}
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${severity === level.value
                                        ? level.color + ' ring-2 ring-offset-1 ring-gray-400'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {level.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Title */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Issue Title *
                    </label>
                    <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Brief description of the issue"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Detailed Description *
                    </label>
                    <textarea
                        required
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Provide detailed information about the issue..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Error */}
                {error && (
                    <div className="p-3 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 justify-end pt-4">
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={isSubmitting || !title || !description}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Submitting...' : 'Report Issue'}
                    </button>
                </div>
            </form>
        </div>
    );
}
