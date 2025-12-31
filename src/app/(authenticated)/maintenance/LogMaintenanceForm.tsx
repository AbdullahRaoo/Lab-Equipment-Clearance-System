'use client';

import { useState, useEffect } from 'react';
import { logMaintenance } from '@/app/actions/maintenance';
import { getInventory } from '@/app/actions/inventory';

export function LogMaintenanceForm({ labId }: { labId?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [inventory, setInventory] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        inventory_id: '',
        maintenance_type: 'preventive',
        performed_by: '',
        service_date: new Date().toISOString().split('T')[0],
        cost: '',
        notes: '',
        next_due_date: ''
    });

    useEffect(() => {
        if (isOpen && labId) {
            // Load inventory for dropdown
            getInventory(labId).then(res => {
                if (res.data) setInventory(res.data);
            });
        }
    }, [isOpen, labId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await logMaintenance(formData);
        setLoading(false);
        setIsOpen(false);
        // Reset?
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="bg-[#105a4b] text-white px-4 py-2 rounded-md font-medium hover:bg-[#0d473b] transition-colors"
            >
                + Log Maintenance
            </button>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900">Record Maintenance Activity</h3>
                <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">Cancel</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Equipment</label>
                    <select
                        value={formData.inventory_id}
                        onChange={e => setFormData({ ...formData, inventory_id: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        required
                    >
                        <option value="">Select Item</option>
                        {inventory.map(item => (
                            <option key={item.id} value={item.id}>
                                {item.name} ({item.asset_tag})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Type</label>
                        <select
                            value={formData.maintenance_type}
                            onChange={e => setFormData({ ...formData, maintenance_type: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        >
                            <option value="preventive">Preventive Maintenance</option>
                            <option value="corrective">Corrective (Repair)</option>
                            <option value="calibration">Calibration</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Date Performed</label>
                        <input
                            type="date"
                            value={formData.service_date}
                            onChange={e => setFormData({ ...formData, service_date: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Cost (PKR)</label>
                        <input
                            type="number"
                            value={formData.cost}
                            onChange={e => setFormData({ ...formData, cost: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Performed By</label>
                        <input
                            type="text"
                            value={formData.performed_by}
                            onChange={e => setFormData({ ...formData, performed_by: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            placeholder="Internal Staff or Vendor Name"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Technician Notes</label>
                    <textarea
                        value={formData.notes}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        rows={2}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 text-[#105a4b] font-bold">Next Due Date</label>
                    <input
                        type="date"
                        value={formData.next_due_date}
                        onChange={e => setFormData({ ...formData, next_due_date: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm ring-1 ring-[#105a4b]"
                        required
                    />
                    <p className="text-xs text-gray-500 mt-1">This will update the predictive maintenance schedule.</p>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#105a4b] text-white py-2 rounded-md hover:bg-[#0d473b]"
                >
                    {loading ? 'Saving...' : 'Save Log'}
                </button>
            </form>
        </div>
    );
}
