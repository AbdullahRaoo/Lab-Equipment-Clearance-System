'use client';

import { useState } from 'react';
import { updateProfile } from '@/app/actions/profile';
import { useRouter } from 'next/navigation';

export function ProfileForm({ user }: { user: any }) {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const router = useRouter();

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        setMessage('');

        const result = await updateProfile(formData);
        setLoading(false);

        if (result?.error) {
            setMessage('Error: ' + result.error);
        } else {
            setMessage('Profile updated successfully!');
            router.refresh();
        }
    };

    return (
        <form action={handleSubmit} className="space-y-6 max-w-2xl">
            {message && (
                <div className={`p-4 rounded-md ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    {message}
                </div>
            )}

            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-4">
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                        type="text"
                        name="full_name"
                        defaultValue={user.full_name}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#105a4b] focus:border-[#105a4b] sm:text-sm"
                    />
                </div>

                <div className="sm:col-span-4">
                    <label className="block text-sm font-medium text-gray-700">Email (Read-only)</label>
                    <input
                        type="text"
                        value={user.email}
                        disabled
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-500 sm:text-sm"
                    />
                </div>

                <div className="sm:col-span-3">
                    <label className="block text-sm font-medium text-gray-700">Department</label>
                    <select
                        name="department"
                        defaultValue={user.department}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#105a4b] focus:border-[#105a4b] sm:text-sm"
                    >
                        <option value="">Select Department</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Computer Engineering">Computer Engineering</option>
                        <option value="Software Engineering">Software Engineering</option>
                        <option value="Electrical Engineering">Electrical Engineering</option>
                        <option value="Mechanical Engineering">Mechanical Engineering</option>
                    </select>
                </div>

                {user.role === 'student' && (
                    <div className="sm:col-span-3">
                        <label className="block text-sm font-medium text-gray-700">Registration Number</label>
                        <input
                            type="text"
                            name="reg_no"
                            defaultValue={user.reg_no}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#105a4b] focus:border-[#105a4b] sm:text-sm"
                        />
                    </div>
                )}

                <div className="sm:col-span-4">
                    <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                    <input
                        type="text"
                        name="contact_no"
                        defaultValue={user.contact_no}
                        placeholder="0300-1234567"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#105a4b] focus:border-[#105a4b] sm:text-sm"
                    />
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#105a4b] py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-[#0d473b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#105a4b] disabled:opacity-50"
                >
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </form>
    );
}
