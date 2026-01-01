'use client';

import { useState, useTransition } from 'react';
import { createFacultyUser, updateUserRole, toggleUserStatus, deleteUser, assignSecondaryRole } from '@/app/actions/users';
import { UserRole, ROLE_LABELS, ROLE_COLORS, ROLE_LEVELS, canManageRole, Lab, Profile } from '@/types/clearance';

interface UserManagementClientProps {
    users: Profile[];
    labs: Lab[];
    currentUserRole: UserRole;
}

export default function UserManagementClient({ users, labs, currentUserRole }: UserManagementClientProps) {
    const [isPending, startTransition] = useTransition();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Filter available roles based on current user's permissions
    const availableRoles = (Object.keys(ROLE_LEVELS) as UserRole[]).filter(
        role => canManageRole(currentUserRole, role)
    );

    const handleCreateUser = async (formData: FormData) => {
        startTransition(async () => {
            const result = await createFacultyUser(formData);
            if (result.error) {
                setMessage({ type: 'error', text: result.error });
            } else {
                setMessage({ type: 'success', text: result.message || 'User created' });
                setShowCreateModal(false);
            }
        });
    };

    const handleToggleStatus = async (userId: string) => {
        startTransition(async () => {
            const result = await toggleUserStatus(userId);
            if (result.error) {
                setMessage({ type: 'error', text: result.error });
            }
        });
    };

    const handleDeleteUser = async (userId: string, name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) return;

        startTransition(async () => {
            const result = await deleteUser(userId);
            if (result.error) {
                setMessage({ type: 'error', text: result.error });
            } else {
                setMessage({ type: 'success', text: result.message || 'User deleted' });
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-500 mt-1">Manage faculty and staff accounts</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 shadow-lg"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add User
                </button>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-4 rounded-lg ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                    {message.text}
                    <button onClick={() => setMessage(null)} className="float-right">×</button>
                </div>
            )}

            {/* Role Legend */}
            <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg">
                {(Object.keys(ROLE_LABELS) as UserRole[]).map(role => (
                    <span key={role} className={`px-3 py-1 rounded-full text-xs font-medium border ${ROLE_COLORS[role]}`}>
                        {ROLE_LABELS[role]}
                    </span>
                ))}
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Role</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Lab</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map(user => (
                            <tr key={user.id} className={`hover:bg-gray-50 ${!user.is_active ? 'opacity-50' : ''}`}>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold">
                                            {user.full_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{user.full_name}</p>
                                            <p className="text-sm text-gray-500">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="space-y-1">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${ROLE_COLORS[user.role]}`}>
                                            {ROLE_LABELS[user.role]}
                                        </span>
                                        {user.secondary_role && (
                                            <span className={`block px-3 py-1 rounded-full text-xs font-medium border ${ROLE_COLORS[user.secondary_role]}`}>
                                                + {ROLE_LABELS[user.secondary_role]}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {user.labs ? (
                                        <span className="text-sm text-gray-700">{(user.labs as Lab).name}</span>
                                    ) : (
                                        <span className="text-sm text-gray-400">—</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => handleToggleStatus(user.id)}
                                        disabled={isPending || !canManageRole(currentUserRole, user.role)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium ${user.is_active
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-700'
                                            } ${canManageRole(currentUserRole, user.role) ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed'}`}
                                    >
                                        {user.is_active ? 'Active' : 'Inactive'}
                                    </button>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {canManageRole(currentUserRole, user.role) && (
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => setSelectedUser(user)}
                                                className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                                title="Edit"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.id, user.full_name)}
                                                disabled={isPending}
                                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                title="Delete"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-bold">Create Faculty Account</h2>
                        </div>
                        <form action={handleCreateUser} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    name="full_name"
                                    required
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    minLength={6}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                                <select
                                    name="role"
                                    required
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                                >
                                    {availableRoles.filter(r => r !== 'student').map(role => (
                                        <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Lab</label>
                                <select
                                    name="lab_id"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="">No specific lab</option>
                                    {labs.map(lab => (
                                        <option key={lab.id} value={lab.id}>{lab.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                                <input
                                    type="tel"
                                    name="contact_no"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                                >
                                    {isPending ? 'Creating...' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
