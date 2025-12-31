'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createDevUser, CreateUserState } from '@/app/actions/dev-setup';
import { useState } from 'react';

const initialState: CreateUserState = {};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
        >
            {pending ? 'Creating User...' : 'Create User'}
        </button>
    );
}

export default function DevSetupPage() {
    const [state, formAction] = useFormState(createDevUser, initialState);
    const [role, setRole] = useState('student');

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto bg-white p-8 rounded shadow">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">🛠️ User Creator (Dev)</h2>

                {state.message && (
                    <div className={`p-4 mb-4 rounded ${state.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {state.message}
                    </div>
                )}

                <form action={formAction} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Role</label>
                        <select
                            name="role"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                        >
                            <option value="hod">HOD (Admin)</option>
                            <option value="pro_hod">Pro HOD</option>
                            <option value="lab_incharge">Lab Incharge</option>
                            <option value="lab_assistant">Lab Assistant</option>
                            <option value="student">Student</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            name="email"
                            defaultValue="hod@nutech.edu.pk"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input
                            type="text"
                            name="full_name"
                            defaultValue="Dr. System HOD"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="text"
                            name="password"
                            defaultValue="password123"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                            required
                        />
                    </div>

                    {(role === 'lab_incharge' || role === 'lab_assistant') && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Lab Code</label>
                            <select name="lab_code" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border">
                                <option value="ROBO">Robotic Lab (ROBO)</option>
                                <option value="DLD">DLD Lab (DLD)</option>
                                <option value="IOT">IOT Lab (IOT)</option>
                                <option value="EMB">Embedded Lab (EMB)</option>
                                <option value="CNET">Network Lab (CNET)</option>
                            </select>
                        </div>
                    )}

                    <SubmitButton />
                </form>

                {state.logs && (
                    <div className="mt-8 bg-black text-green-400 p-4 rounded text-xs font-mono h-64 overflow-y-auto">
                        <p className="text-gray-500 border-b border-gray-700 mb-2 pb-1">Server Logs:</p>
                        {state.logs.map((log, i) => (
                            <div key={i} className="mb-1">{log}</div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
