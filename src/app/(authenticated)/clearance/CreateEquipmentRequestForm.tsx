'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createEquipmentRequest } from '@/app/actions/equipment-request';
import { getLabs, getInventory } from '@/app/actions/inventory';
import { Lab, InventoryItem } from '@/types/clearance';

type Step = 1 | 2 | 3 | 4 | 5;

const STEPS = [
    { id: 1, title: 'Laboratory', icon: '🏛️' },
    { id: 2, title: 'Equipment', icon: '🔧' },
    { id: 3, title: 'Details', icon: '📝' },
    { id: 4, title: 'Team', icon: '👥' },
    { id: 5, title: 'Review', icon: '✅' },
];

export function CreateEquipmentRequestForm() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Step State
    const [currentStep, setCurrentStep] = useState<Step>(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Data State
    const [labs, setLabs] = useState<Lab[]>([]);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [userProfile, setUserProfile] = useState<{ full_name: string; reg_no?: string } | null>(null);

    // Form State
    const [selectedLab, setSelectedLab] = useState<string>('');
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [requestType, setRequestType] = useState<'university' | 'home'>('university');
    const [purpose, setPurpose] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [supervisorName, setSupervisorName] = useState('');
    const [isGroupProject, setIsGroupProject] = useState(false);
    const [additionalMembers, setAdditionalMembers] = useState<{ name: string; reg_no: string }[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Load initial data
    useEffect(() => {
        async function loadData() {
            const labsResult = await getLabs();
            if (labsResult.data) {
                setLabs(labsResult.data);
                const preselectedLab = searchParams.get('lab');
                if (preselectedLab) setSelectedLab(preselectedLab);
            }

            const { getCurrentUser } = await import('@/app/actions/auth');
            const user = await getCurrentUser();
            if (user) {
                setUserProfile({ full_name: user.full_name, reg_no: user.reg_no || '' });
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
            setQuantities({});
        }
        loadInventory();
    }, [selectedLab]);

    // Pre-select item from URL
    useEffect(() => {
        const preselectedItem = searchParams.get('item');
        if (preselectedItem && inventory.length > 0 && !selectedItems.includes(preselectedItem)) {
            const item = inventory.find(i => i.id === preselectedItem);
            if (item) addItem(item);
        }
    }, [inventory, searchParams]);

    // Item Management
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

    // Team Management
    const addMember = () => setAdditionalMembers([...additionalMembers, { name: '', reg_no: '' }]);
    const removeMember = (idx: number) => setAdditionalMembers(prev => prev.filter((_, i) => i !== idx));
    const updateMember = (idx: number, field: 'name' | 'reg_no', value: string) => {
        const updated = [...additionalMembers];
        updated[idx][field] = value;
        setAdditionalMembers(updated);
    };

    // Navigation
    const canProceed = useCallback((): boolean => {
        switch (currentStep) {
            case 1: return !!selectedLab;
            case 2: return selectedItems.length > 0;
            case 3: return !!purpose && !!startDate && !!endDate;
            case 4: return true; // Optional step
            case 5: return true;
            default: return false;
        }
    }, [currentStep, selectedLab, selectedItems, purpose, startDate, endDate]);

    const nextStep = () => {
        if (canProceed() && currentStep < 5) {
            setCurrentStep((currentStep + 1) as Step);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep((currentStep - 1) as Step);
        }
    };

    // Submit
    const handleSubmit = async () => {
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

    // Filtered inventory
    const filteredInventory = inventory.filter(item =>
        !selectedItems.includes(item.id) &&
        (item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.asset_tag && item.asset_tag.toLowerCase().includes(searchQuery.toLowerCase())))
    );

    // Get selected lab name
    const selectedLabName = labs.find(l => l.id === selectedLab)?.name || 'Not selected';

    if (success) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-bounce">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
                    <p className="text-gray-500">Redirecting to your requests...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex items-center justify-between relative">
                    {/* Background Line */}
                    <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-10" />
                    <div
                        className="absolute top-5 left-0 h-0.5 bg-emerald-500 -z-10 transition-all duration-500"
                        style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                    />

                    {STEPS.map((step) => (
                        <button
                            key={step.id}
                            onClick={() => step.id < currentStep && setCurrentStep(step.id as Step)}
                            disabled={step.id > currentStep}
                            className={`flex flex-col items-center transition-all ${step.id <= currentStep ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                                }`}
                        >
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-medium transition-all duration-300 ${step.id === currentStep
                                    ? 'bg-emerald-500 text-white shadow-lg scale-110'
                                    : step.id < currentStep
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-gray-200 text-gray-500'
                                    }`}
                            >
                                {step.id < currentStep ? '✓' : step.icon}
                            </div>
                            <span className={`text-xs mt-2 font-medium ${step.id === currentStep ? 'text-emerald-600' : 'text-gray-500'}`}>
                                {step.title}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 flex items-center gap-3">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </div>
            )}

            {/* Step Content */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-8">
                    {/* Step 1: Lab Selection */}
                    {currentStep === 1 && (
                        <div className="animate-fadeIn">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Laboratory</h2>
                            <p className="text-gray-500 mb-8">Choose the lab from which you want to borrow equipment</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {labs.map(lab => (
                                    <button
                                        key={lab.id}
                                        onClick={() => setSelectedLab(lab.id)}
                                        className={`p-6 rounded-xl border-2 text-left transition-all duration-200 ${selectedLab === lab.id
                                            ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20'
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="text-3xl mb-3">🏛️</div>
                                        <h3 className="font-semibold text-gray-900">{lab.name}</h3>
                                        <p className="text-sm text-gray-500 mt-1">{lab.code}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Equipment Selection */}
                    {currentStep === 2 && (
                        <div className="animate-fadeIn">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Equipment</h2>
                            <p className="text-gray-500 mb-8">Choose the items you need from {selectedLabName}</p>

                            {/* Selected Items */}
                            {selectedItems.length > 0 && (
                                <div className="mb-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                                    <h4 className="font-medium text-emerald-800 mb-3 flex items-center gap-2">
                                        <span className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm">{selectedItems.length}</span>
                                        Selected Items
                                    </h4>
                                    <div className="space-y-2">
                                        {selectedItems.map(itemId => {
                                            const item = inventory.find(i => i.id === itemId);
                                            if (!item) return null;
                                            return (
                                                <div key={itemId} className="flex items-center justify-between bg-white p-3 rounded-lg">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{item.name}</p>
                                                        <p className="text-xs text-gray-500">{item.asset_tag}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center border rounded-lg overflow-hidden">
                                                            <button
                                                                type="button"
                                                                onClick={() => updateQuantity(itemId, (quantities[itemId] || 1) - 1)}
                                                                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600"
                                                            >−</button>
                                                            <span className="px-4 py-1 text-sm font-medium">{quantities[itemId] || 1}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => updateQuantity(itemId, (quantities[itemId] || 1) + 1)}
                                                                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600"
                                                            >+</button>
                                                        </div>
                                                        <button onClick={() => removeItem(itemId)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
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

                            {/* Search */}
                            <div className="relative mb-4">
                                <input
                                    type="text"
                                    placeholder="Search equipment..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>

                            {/* Available Items */}
                            <div className="border border-gray-200 rounded-xl max-h-64 overflow-y-auto">
                                {filteredInventory.length === 0 ? (
                                    <p className="text-center text-gray-500 py-8">No items found</p>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {filteredInventory.map(item => (
                                            <button
                                                key={item.id}
                                                onClick={() => addItem(item)}
                                                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 text-left group"
                                            >
                                                <div>
                                                    <p className="font-medium text-gray-900 group-hover:text-emerald-600">{item.name}</p>
                                                    <p className="text-sm text-gray-500">{item.asset_tag}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                                                        Qty: {item.quantity || 1}
                                                    </span>
                                                    <span className="text-emerald-600 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                                        + Add
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Request Details */}
                    {currentStep === 3 && (
                        <div className="animate-fadeIn space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Details</h2>
                                <p className="text-gray-500">Provide information about your request</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Request Type</label>
                                    <div className="flex gap-3">
                                        {['university', 'home'].map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setRequestType(type as 'university' | 'home')}
                                                className={`flex-1 py-3 px-4 rounded-xl border-2 font-medium transition-all ${requestType === type
                                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                                    }`}
                                            >
                                                {type === 'university' ? '🏫 University' : '🏠 Home'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Supervisor (Optional)</label>
                                    <input
                                        type="text"
                                        value={supervisorName}
                                        onChange={(e) => setSupervisorName(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
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
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
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
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Purpose *</label>
                                <textarea
                                    value={purpose}
                                    onChange={(e) => setPurpose(e.target.value)}
                                    rows={4}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                                    placeholder="Describe the purpose of this request..."
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 4: Team Members */}
                    {currentStep === 4 && (
                        <div className="animate-fadeIn">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Team Members</h2>
                            <p className="text-gray-500 mb-8">Is this a group project? Add your team members.</p>

                            <div className="mb-6">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={isGroupProject}
                                            onChange={(e) => setIsGroupProject(e.target.checked)}
                                            className="sr-only"
                                        />
                                        <div className={`w-12 h-6 rounded-full transition-colors ${isGroupProject ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${isGroupProject ? 'translate-x-6' : ''}`} />
                                    </div>
                                    <span className="text-lg font-medium text-gray-900">This is a group project</span>
                                </label>
                            </div>

                            {isGroupProject && (
                                <div className="space-y-4 p-6 bg-gray-50 rounded-xl">
                                    {/* Team Lead */}
                                    <div className="p-4 bg-white rounded-lg border border-gray-200">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                                <span className="text-emerald-600 font-bold">👑</span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{userProfile?.full_name || 'You'}</p>
                                                <p className="text-sm text-gray-500">{userProfile?.reg_no || 'Team Lead'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Additional Members */}
                                    {additionalMembers.map((member, idx) => (
                                        <div key={idx} className="flex gap-3">
                                            <div className="flex-1 grid grid-cols-2 gap-3">
                                                <input
                                                    type="text"
                                                    value={member.name}
                                                    onChange={(e) => updateMember(idx, 'name', e.target.value)}
                                                    placeholder="Member name"
                                                    className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                                                />
                                                <input
                                                    type="text"
                                                    value={member.reg_no}
                                                    onChange={(e) => updateMember(idx, 'reg_no', e.target.value)}
                                                    placeholder="Reg. No."
                                                    className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                                                />
                                            </div>
                                            <button onClick={() => removeMember(idx)} className="p-3 text-red-500 hover:bg-red-50 rounded-xl">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={addMember}
                                        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-emerald-500 hover:text-emerald-600 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Add Team Member
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 5: Review */}
                    {currentStep === 5 && (
                        <div className="animate-fadeIn">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Your Request</h2>
                            <p className="text-gray-500 mb-8">Please verify all details before submitting</p>

                            <div className="space-y-6">
                                {/* Lab */}
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Laboratory</h4>
                                    <p className="text-lg font-medium text-gray-900">{selectedLabName}</p>
                                </div>

                                {/* Equipment */}
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <h4 className="text-sm font-semibold text-gray-500 uppercase mb-3">Equipment ({selectedItems.length} items)</h4>
                                    <div className="space-y-2">
                                        {selectedItems.map(itemId => {
                                            const item = inventory.find(i => i.id === itemId);
                                            if (!item) return null;
                                            return (
                                                <div key={itemId} className="flex justify-between items-center bg-white p-3 rounded-lg">
                                                    <span className="font-medium">{item.name}</span>
                                                    <span className="text-emerald-600 font-semibold">×{quantities[itemId] || 1}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Type</h4>
                                        <p className="font-medium">{requestType === 'university' ? '🏫 University Use' : '🏠 Home Use'}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Duration</h4>
                                        <p className="font-medium">{startDate} → {endDate}</p>
                                    </div>
                                </div>

                                {/* Purpose */}
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Purpose</h4>
                                    <p className="text-gray-700">{purpose}</p>
                                </div>

                                {/* Team */}
                                {isGroupProject && (
                                    <div className="p-4 bg-gray-50 rounded-xl">
                                        <h4 className="text-sm font-semibold text-gray-500 uppercase mb-2">Team ({additionalMembers.length + 1} members)</h4>
                                        <p className="font-medium">{userProfile?.full_name} (Lead)</p>
                                        {additionalMembers.map((m, i) => (
                                            <p key={i} className="text-gray-600">{m.name} - {m.reg_no}</p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation Footer */}
                <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex justify-between">
                    <button
                        type="button"
                        onClick={prevStep}
                        disabled={currentStep === 1}
                        className={`px-6 py-3 rounded-xl font-medium transition-all ${currentStep === 1
                            ? 'opacity-0 cursor-default'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                    >
                        ← Back
                    </button>

                    {currentStep < 5 ? (
                        <button
                            type="button"
                            onClick={nextStep}
                            disabled={!canProceed()}
                            className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                        >
                            Continue →
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                    </svg>
                                    Submitting...
                                </>
                            ) : (
                                <>🚀 Submit Request</>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
