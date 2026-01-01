'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createEquipmentRequest } from '@/app/actions/equipment-request';
import { getLabs, getInventory } from '@/app/actions/inventory';
import { Lab, InventoryItem } from '@/types/clearance';

export function CreateEquipmentRequestForm() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [labs, setLabs] = useState<Lab[]>([]);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);

    const [selectedLab, setSelectedLab] = useState<string>('');
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [requestType, setRequestType] = useState<'university' | 'home'>('university');
    const [purpose, setPurpose] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [supervisorName, setSupervisorName] = useState('');
    const [isGroupProject, setIsGroupProject] = useState(false);

    // New State for UI Updates
    const [userProfile, setUserProfile] = useState<{ full_name: string; reg_no?: string } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [additionalMembers, setAdditionalMembers] = useState<{ name: string; reg_no: string }[]>([]);
    const [quantities, setQuantities] = useState<Record<string, number>>({});

    // Load labs and user profile on mount
    useEffect(() => {
        async function loadData() {
            // Load Labs
            const labsResult = await getLabs();
            if (labsResult.data) {
                setLabs(labsResult.data);
                const preselectedLab = searchParams.get('lab');
                if (preselectedLab) setSelectedLab(preselectedLab);
            }

            // Load User Profile
            const { getCurrentUser } = await import('@/app/actions/auth');
            const user = await getCurrentUser();
            if (user) {
                setUserProfile({
                    full_name: user.full_name,
                    reg_no: user.reg_no || ''
                });
            }
        }
        loadData();
    }, [searchParams]);

    // Load inventory
    useEffect(() => {
        async function loadInventory() {
            if (selectedLab) {
                const result = await getInventory(selectedLab);
                if (result.data) {
                    setInventory(result.data.filter(item => item.status === 'available'));
                }
            } else {
                setInventory([]);
            }
            setSelectedItems([]);
            setQuantities({});
        }
        loadInventory();
    }, [selectedLab]);

    // Pre-select item logic
    useEffect(() => {
        const preselectedItem = searchParams.get('item');
        if (preselectedItem && inventory.length > 0 && !selectedItems.includes(preselectedItem)) {
            const item = inventory.find(i => i.id === preselectedItem);
            if (item) {
                addItem(item);
            }
        }
    }, [inventory, searchParams]);

    const addItem = (item: InventoryItem) => {
        if (!selectedItems.includes(item.id)) {
            setSelectedItems([...selectedItems, item.id]);
            setQuantities(prev => ({ ...prev, [item.id]: 1 }));
        }
    };

    const removeItem = (itemId: string) => {
        setSelectedItems(prev => prev.filter(id => id !== itemId));
        setQuantities(prev => {
            const next = { ...prev };
            delete next[itemId];
            return next;
        });
    };

    const updateQuantity = (itemId: string, qty: number) => {
        if (qty < 1) return;
        setQuantities(prev => ({ ...prev, [itemId]: qty }));
    };

    const filteredInventory = inventory.filter(item =>
        !selectedItems.includes(item.id) &&
        (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.asset_tag && item.asset_tag.toLowerCase().includes(searchQuery.toLowerCase())))
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('lab_id', selectedLab);
        formData.append('purpose', purpose);
        formData.append('request_type', requestType);
        formData.append('start_time', startDate);
        formData.append('end_time', endDate);
        formData.append('supervisor_name', supervisorName);
        formData.append('is_group_project', String(isGroupProject));
        // Only send additional members
        formData.append('group_members', JSON.stringify(additionalMembers));

        const itemsToSubmit = selectedItems.map(id => ({
            id,
            quantity: quantities[id] || 1
        }));
        formData.append('items', JSON.stringify(itemsToSubmit));

        const result = await createEquipmentRequest(formData);

        if (result.error) {
            setError(result.error);
        } else {
            setSuccess(true);
            setTimeout(() => router.push('/requests'), 2000);
        }

        setLoading(false);
    };

    const addMember = () => {
        setAdditionalMembers([...additionalMembers, { name: '', reg_no: '' }]);
    };

    const removeMember = (index: number) => {
        setAdditionalMembers(prev => prev.filter((_, i) => i !== index));
    };

    const updateMember = (index: number, field: 'name' | 'reg_no', value: string) => {
        const updated = [...additionalMembers];
        updated[index][field] = value;
        setAdditionalMembers(updated);
    };

    if (success) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Request Submitted!</h3>
                <p className="text-gray-500 mt-1">Redirecting to your requests...</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </div>
            )}

            {/* Lab Selection */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm">1</span>
                    Select Laboratory
                </h3>
                <select
                    value={selectedLab}
                    onChange={(e) => setSelectedLab(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    required
                >
                    <option value="">Choose a lab...</option>
                    {labs.map(lab => (
                        <option key={lab.id} value={lab.id}>{lab.name}</option>
                    ))}
                </select>
            </div>

            {/* Equipment Selection */}
            {selectedLab && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm">2</span>
                        Select Equipment
                    </h3>

                    {/* Selected List */}
                    {selectedItems.length > 0 && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Selected Items ({selectedItems.length})</label>
                            <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
                                {selectedItems.map(itemId => {
                                    const item = inventory.find(i => i.id === itemId);
                                    if (!item) return null;
                                    return (
                                        <div key={itemId} className="p-3 flex items-center justify-between bg-emerald-50/50">
                                            <div>
                                                <p className="font-medium text-gray-900">{item.name}</p>
                                                <p className="text-xs text-gray-500">{item.asset_tag}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center bg-white border border-gray-300 rounded-lg h-9">
                                                    <span className="px-3 text-xs text-gray-500 font-medium border-r border-gray-300 bg-gray-50 h-full flex items-center rounded-l-lg">Qty</span>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={quantities[itemId] || 1}
                                                        onChange={(e) => updateQuantity(itemId, parseInt(e.target.value) || 1)}
                                                        className="w-16 h-full px-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-r-lg"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(itemId)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Search and Add */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Add Equipment
                        </label>
                        <div className="relative mb-3">
                            <input
                                type="text"
                                placeholder="Search by name or asset tag..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        {inventory.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-4">No available equipment in this lab</p>
                        ) : filteredInventory.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-4">No item matches your search</p>
                        ) : (
                            <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto divide-y divide-gray-100">
                                {filteredInventory.map(item => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => addItem(item)}
                                        className="w-full p-3 flex items-center justify-between hover:bg-gray-50 text-left transition-colors group"
                                    >
                                        <div>
                                            <p className="font-medium text-gray-900 text-sm group-hover:text-emerald-700">{item.name}</p>
                                            <p className="text-xs text-gray-500 group-hover:text-emerald-600">{item.asset_tag}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">
                                                Avail: {item.quantity || 1}
                                            </span>
                                            <span className="text-emerald-600 font-medium text-sm">+ Add</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Request Details */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm">3</span>
                    Request Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Request Type *</label>
                        <select
                            value={requestType}
                            onChange={(e) => setRequestType(e.target.value as 'university' | 'home')}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="university">University Use</option>
                            <option value="home">Home Use</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Supervisor (Optional)</label>
                        <input
                            type="text"
                            value={supervisorName}
                            onChange={(e) => setSupervisorName(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                            placeholder="Dr. / Prof. Name"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Return Date *</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            min={startDate || new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Purpose *</label>
                    <textarea
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        placeholder="Describe the purpose of this request..."
                        required
                    />
                </div>
            </div>

            {/* Group Project */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <input
                        type="checkbox"
                        id="groupProject"
                        checked={isGroupProject}
                        onChange={(e) => setIsGroupProject(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-gray-300"
                    />
                    <label htmlFor="groupProject" className="text-base font-medium text-gray-900">
                        This is a group project
                    </label>
                </div>

                {isGroupProject && (
                    <div className="space-y-4 pl-7">
                        <p className="text-sm text-gray-500 mb-2">List all group members involved in this request.</p>

                        {/* Fixed User Row */}
                        <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg opacity-70">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase">Team Lead (You)</label>
                                <div className="text-sm font-medium text-gray-900 mt-1">{userProfile?.full_name || 'Loading...'}</div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase">Reg No</label>
                                <div className="text-sm font-medium text-gray-900 mt-1">{userProfile?.reg_no || '...'}</div>
                            </div>
                        </div>

                        {/* Additional Members */}
                        {additionalMembers.map((member, idx) => (
                            <div key={idx} className="flex gap-2 items-start">
                                <div className="grid grid-cols-2 gap-3 flex-1">
                                    <input
                                        type="text"
                                        value={member.name}
                                        onChange={(e) => updateMember(idx, 'name', e.target.value)}
                                        placeholder="Member Name"
                                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                    <input
                                        type="text"
                                        value={member.reg_no}
                                        onChange={(e) => updateMember(idx, 'reg_no', e.target.value)}
                                        placeholder="Reg. No."
                                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeMember(idx)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg mt-0.5"
                                    title="Remove member"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={addMember}
                            className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1 mt-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Another Member
                        </button>
                    </div>
                )}
            </div>

            <div className="pt-4">
                <button
                    type="submit"
                    disabled={loading || selectedItems.length === 0}
                    className="w-full py-4 text-center bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.99]"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing Request...
                        </span>
                    ) : 'Submit Equipment Request'}
                </button>
            </div>
        </form>
    );
}
