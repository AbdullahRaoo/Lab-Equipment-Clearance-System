'use client';

import { useState } from 'react';
import { createProcurementRequest } from '@/app/actions/procurement';

export function CreateProcurementForm() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        item_name: '',
        specification: '',
        quantity: '1',
        estimated_cost: '',
        justification: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await createProcurementRequest(formData);
        setLoading(false);
        setIsOpen(false);
        setFormData({ item_name: '', specification: '', quantity: '1', estimated_cost: '', justification: '' });
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="bg-[#105a4b] text-white px-4 py-2 rounded-md font-medium hover:bg-[#0d473b] transition-colors"
            >
                + New Purchase Request
            </button>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Initiate Purchase Request</h3>
                <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">Cancel</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Item Name</label>
                        <input
                            type="text"
                            required
                            value={formData.item_name}
                            onChange={e => setFormData({ ...formData, item_name: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Estimated Cost (Unit)</label>
                        <input
                            type="number"
                            required
                            value={formData.estimated_cost}
                            onChange={e => setFormData({ ...formData, estimated_cost: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Quantity</label>
                        <input
                            type="number"
                            min="1"
                            required
                            value={formData.quantity}
                            onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Specification / Model</label>
                        <input
                            type="text"
                            value={formData.specification}
                            onChange={e => setFormData({ ...formData, specification: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            placeholder="e.g. Dell Optiplex 7090 or equivalent"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Justification (Why is this needed?)</label>
                    <textarea
                        required
                        value={formData.justification}
                        onChange={e => setFormData({ ...formData, justification: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        rows={3}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#105a4b] text-white py-2 rounded-md hover:bg-[#0d473b]"
                >
                    {loading ? 'Submitting...' : 'Submit to HOD'}
                </button>
            </form>
        </div>
    );
}
