'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addInventoryItem, getLabs } from '@/app/actions/inventory';
import { getCurrentUser } from '@/app/actions/auth';
import Link from 'next/link';

export default function AddInventoryPage() {
    const router = useRouter();
    const [labs, setLabs] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        lab_id: '',
        model: '',
        serial_no: '',
        asset_tag: '',
        price: '',
        purchase_date: '',
        supplier: '',
        maintenance_interval_days: ''
    });

    useEffect(() => {
        // Fetch labs and user on mount
        // Ideally pass user as prop if this was server component, but client page is fine for form
        // We can fetch user via simple action wrapper or just check role from session if available
        // But for now let's just fetch labs. User auth check server side protects action.
        getLabs().then(res => {
            if (res.data) setLabs(res.data);
        });

        // We need to know if user is forced to a lab. 
        // Let's rely on server action validation or fetch user profile here?
        // I'll fetch current user quickly to pre-fill lab
        getCurrentUser().then(u => {
            setUser(u);
            if (u && u.assigned_lab_id) {
                setFormData(prev => ({ ...prev, lab_id: u.assigned_lab_id }));
            }
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const res = await addInventoryItem({
            ...formData,
            lab_id: user?.assigned_lab_id || formData.lab_id
        });

        if (res.error) {
            setError(res.error);
            setLoading(false);
        } else {
            router.push('/inventory');
            router.refresh();
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/inventory" className="text-gray-500 hover:text-gray-700">
                    ← Back
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Add New Equipment</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">

                {/* Lab Selection (Only if not assigned) */}
                {user && !user.assigned_lab_id && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Laboratory</label>
                        <select
                            value={formData.lab_id}
                            onChange={e => setFormData({ ...formData, lab_id: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            required
                        >
                            <option value="">Select Lab</option>
                            {labs.map(lab => (
                                <option key={lab.id} value={lab.id}>{lab.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {user && user.assigned_lab_id && (
                    <div className="bg-gray-50 p-3 rounded text-sm text-gray-600 border border-gray-200">
                        Adding to: <strong>{labs.find(l => l.id === user.assigned_lab_id)?.name || 'Your Assigned Lab'}</strong>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700">Equipment Name</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#105a4b] focus:ring-[#105a4b]"
                        placeholder="e.g. Oscilloscope Tektronix"
                        required
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Asset Tag / ID</label>
                        <input
                            type="text"
                            value={formData.asset_tag}
                            onChange={e => setFormData({ ...formData, asset_tag: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            placeholder="NUTECH-ROBO-001"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Model</label>
                        <input
                            type="text"
                            value={formData.model}
                            onChange={e => setFormData({ ...formData, model: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Serial No</label>
                        <input
                            type="text"
                            value={formData.serial_no}
                            onChange={e => setFormData({ ...formData, serial_no: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Price (PKR)</label>
                        <input
                            type="number"
                            value={formData.price}
                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Supplier</label>
                        <input
                            type="text"
                            value={formData.supplier}
                            onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            placeholder="e.g. Tektronix Inc."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Maintenance Interval (Days)</label>
                        <input
                            type="number"
                            value={formData.maintenance_interval_days}
                            onChange={e => setFormData({ ...formData, maintenance_interval_days: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            placeholder="e.g. 180"
                        />
                    </div>
                </div>

                {error && <p className="text-red-600 text-sm">{error}</p>}

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#105a4b] text-white py-2 px-4 rounded hover:bg-[#0d473b] transition-colors disabled:opacity-50 font-medium"
                    >
                        {loading ? 'Adding...' : 'Add Equipment'}
                    </button>
                </div>
            </form>
        </div>
    );
}
