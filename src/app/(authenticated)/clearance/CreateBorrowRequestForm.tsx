'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createBorrowRequest } from '@/app/actions/borrow';
import { getInventory, getLabs } from '@/app/actions/inventory';
import { Lab, InventoryItem } from '@/types/clearance';

export function CreateBorrowRequestForm() {
    const [labs, setLabs] = useState<Lab[]>([]);
    const [selectedLab, setSelectedLab] = useState<string>('');
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        request_type: 'university',
        purpose: '',
        start_time: '',
        end_time: '',
        is_group_project: false,
        group_members_text: '' // Comma separated for simplicity now
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const searchParams = useSearchParams();

    // Fetch Labs on Mount
    useEffect(() => {
        getLabs().then(res => {
            if (res.data) {
                setLabs(res.data);

                // Pre-select Lab from URL
                const urlLabId = searchParams.get('labId');
                if (urlLabId) setSelectedLab(urlLabId);
            }
        });
    }, [searchParams]);

    // Fetch Inventory when Lab changes
    useEffect(() => {
        if (selectedLab) {
            getInventory(selectedLab).then(res => {
                if (res.data) {
                    setInventory(res.data);

                    // Pre-select Item from URL if matches lab
                    const urlItemId = searchParams.get('itemId');
                    if (urlItemId) {
                        // Check if item belongs to this lab inventory
                        const itemExists = res.data.find((i: any) => i.id === urlItemId);
                        if (itemExists) {
                            setSelectedItems(prev => prev.includes(urlItemId) ? prev : [...prev, urlItemId]);
                        }
                    }
                }
                else setInventory([]);
            });
        }
    }, [selectedLab, searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        const groupMembers = formData.group_members_text.split(',').map(s => s.trim()).filter(s => s);

        const payload = {
            lab_id: selectedLab,
            ...formData,
            group_members: groupMembers,
            inventory_ids: selectedItems
        };

        const res = await createBorrowRequest(payload);
        setLoading(false);

        if (res.error) {
            setMessage('Error: ' + res.error);
        } else {
            setMessage('Request submitted successfully!');
            // Reset form or redirect
            window.location.reload();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">New Equipment Request</h3>

            {/* Lab Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Select Laboratory</label>
                <select
                    value={selectedLab}
                    onChange={(e) => setSelectedLab(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#105a4b] focus:ring-[#105a4b]"
                    required
                >
                    <option value="">-- Choose Lab --</option>
                    {labs.map(lab => (
                        <option key={lab.id} value={lab.id}>{lab.name}</option>
                    ))}
                </select>
            </div>

            {/* Item Selection (Multi) */}
            {selectedLab && (
                <div>
                    <label className="block text-sm font-medium text-gray-700">Select Equipment</label>
                    <div className="mt-1 max-h-40 overflow-y-auto border rounded-md p-2 grid grid-cols-1 gap-2">
                        {inventory.length === 0 && <p className="text-sm text-gray-400">No available equipment.</p>}
                        {inventory.map(item => (
                            <label key={item.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedItems.includes(item.id)}
                                    onChange={(e) => {
                                        if (e.target.checked) setSelectedItems([...selectedItems, item.id]);
                                        else setSelectedItems(selectedItems.filter(id => id !== item.id));
                                    }}
                                    className="rounded text-[#105a4b] focus:ring-[#105a4b]"
                                />
                                <span className="text-sm text-gray-700">{item.name} <span className="text-xs text-gray-500">({item.status})</span></span>
                            </label>
                        ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{selectedItems.length} items selected</p>
                </div>
            )}

            {/* Checkbox Group Project */}
            <div className="flex items-center">
                <input
                    type="checkbox"
                    checked={formData.is_group_project}
                    onChange={(e) => setFormData({ ...formData, is_group_project: e.target.checked })}
                    className="rounded text-[#105a4b] focus:ring-[#105a4b]"
                />
                <label className="ml-2 text-sm text-gray-700">Is this a Group Project / FYP?</label>
            </div>

            {formData.is_group_project && (
                <div>
                    <label className="block text-sm font-medium text-gray-700">Group Members (Reg Nos)</label>
                    <input
                        type="text"
                        placeholder="ST-101, ST-102"
                        value={formData.group_members_text}
                        onChange={(e) => setFormData({ ...formData, group_members_text: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#105a4b] focus:ring-[#105a4b]"
                    />
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <select
                        value={formData.request_type}
                        onChange={(e) => setFormData({ ...formData, request_type: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    >
                        <option value="university">Use in University</option>
                        <option value="home">Take Home</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Purpose</label>
                    <input
                        type="text"
                        value={formData.purpose}
                        onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        required
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Start Time</label>
                    <input
                        type="datetime-local"
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">End Time</label>
                    <input
                        type="datetime-local"
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        required
                    />
                </div>
            </div>

            {message && (
                <div className={`p-3 rounded text-sm ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    {message}
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#105a4b] text-white py-2 px-4 rounded hover:bg-[#0d473b] transition-colors font-medium disabled:opacity-50"
            >
                {loading ? 'Submitting...' : 'Submit Request'}
            </button>

        </form>
    );
}
