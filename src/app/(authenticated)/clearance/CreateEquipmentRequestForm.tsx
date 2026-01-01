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
    const [groupMembers, setGroupMembers] = useState<{ name: string, reg_no: string }[]>([]);

    // Load labs on mount
    useEffect(() => {
        async function loadData() {
            const labsResult = await getLabs();
            if (labsResult.data) {
                setLabs(labsResult.data);
                // Check for pre-selected lab from URL
                const preselectedLab = searchParams.get('lab');
                if (preselectedLab) {
                    setSelectedLab(preselectedLab);
                }
            }
        }
        loadData();
    }, [searchParams]);

    // Load inventory when lab changes
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
        }
        loadInventory();
    }, [selectedLab]);

    // Check for pre-selected item from URL
    useEffect(() => {
        const preselectedItem = searchParams.get('item');
        if (preselectedItem && inventory.length > 0) {
            if (!selectedItems.includes(preselectedItem)) {
                setSelectedItems([preselectedItem]);
            }
        }
    }, [inventory, searchParams]);

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
        formData.append('group_members', JSON.stringify(groupMembers));
        selectedItems.forEach(id => formData.append('item_ids', id));

        const result = await createEquipmentRequest(formData);

        if (result.error) {
            setError(result.error);
        } else {
            setSuccess(true);
            setTimeout(() => router.push('/requests'), 2000);
        }

        setLoading(false);
    };

    const toggleItem = (itemId: string) => {
        setSelectedItems(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const addGroupMember = () => {
        setGroupMembers([...groupMembers, { name: '', reg_no: '' }]);
    };

    const updateGroupMember = (index: number, field: 'name' | 'reg_no', value: string) => {
        const updated = [...groupMembers];
        updated[index][field] = value;
        setGroupMembers(updated);
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
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    {error}
                </div>
            )}

            {/* Lab Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Laboratory *
                </label>
                <select
                    value={selectedLab}
                    onChange={(e) => setSelectedLab(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
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
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Equipment * ({selectedItems.length} selected)
                    </label>
                    {inventory.length === 0 ? (
                        <p className="text-gray-500 text-sm">No available equipment in this lab</p>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-2 border rounded-lg">
                            {inventory.map(item => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => toggleItem(item.id)}
                                    className={`p-3 rounded-lg border text-left transition-all ${selectedItems.includes(item.id)
                                            ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <p className="font-medium text-sm text-gray-900 truncate">{item.name}</p>
                                    <p className="text-xs text-gray-500">{item.asset_tag}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Request Type */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Request Type *
                    </label>
                    <select
                        value={requestType}
                        onChange={(e) => setRequestType(e.target.value as 'university' | 'home')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    >
                        <option value="university">University Use</option>
                        <option value="home">Home Use</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Supervisor (if applicable)
                    </label>
                    <input
                        type="text"
                        value={supervisorName}
                        onChange={(e) => setSupervisorName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        placeholder="Dr. / Prof. Name"
                    />
                </div>
            </div>

            {/* Duration */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date *
                    </label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Return Date *
                    </label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={startDate || new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        required
                    />
                </div>
            </div>

            {/* Purpose */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purpose *
                </label>
                <textarea
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="Describe why you need this equipment..."
                    required
                />
            </div>

            {/* Group Project Toggle */}
            <div className="flex items-center gap-3">
                <input
                    type="checkbox"
                    id="groupProject"
                    checked={isGroupProject}
                    onChange={(e) => setIsGroupProject(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <label htmlFor="groupProject" className="text-sm text-gray-700">
                    This is a group project
                </label>
            </div>

            {/* Group Members */}
            {isGroupProject && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700">Group Members</label>
                        <button
                            type="button"
                            onClick={addGroupMember}
                            className="text-sm text-emerald-600 hover:text-emerald-700"
                        >
                            + Add Member
                        </button>
                    </div>
                    {groupMembers.map((member, idx) => (
                        <div key={idx} className="grid grid-cols-2 gap-2">
                            <input
                                type="text"
                                value={member.name}
                                onChange={(e) => updateGroupMember(idx, 'name', e.target.value)}
                                placeholder="Name"
                                className="px-3 py-2 border rounded-lg text-sm"
                            />
                            <input
                                type="text"
                                value={member.reg_no}
                                onChange={(e) => updateGroupMember(idx, 'reg_no', e.target.value)}
                                placeholder="Reg. No."
                                className="px-3 py-2 border rounded-lg text-sm"
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Submit */}
            <button
                type="submit"
                disabled={loading || selectedItems.length === 0}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-lg shadow-lg hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 transition-all"
            >
                {loading ? 'Submitting...' : 'Submit Equipment Request'}
            </button>
        </form>
    );
}
