'use client';

import { signOut } from '@/app/actions/auth';

export function Header({ user }: { user: any }) {
    return (
        <header className="bg-white border-b border-gray-200 h-16 px-8 flex items-center justify-between shadow-sm">
            <div className="flex items-center text-sm text-gray-500">
                <span className="font-medium text-gray-900">NUTECH ECMS</span>
                <span className="mx-2">/</span>
                <span className="capitalize">{user.role.replace('_', ' ')} Dashboard</span>
            </div>

            <div className="flex items-center gap-4">
                {/* Notification Bell (Placeholder) */}
                <button className="p-2 text-gray-400 hover:text-gray-600 relative">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                <div className="h-8 w-px bg-gray-200 mx-1"></div>

                <div className="flex items-center gap-3">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                    </div>

                    <form action={signOut}>
                        <button type="submit" className="text-sm text-red-600 hover:text-red-800 font-medium px-2 py-1">
                            Sign Out
                        </button>
                    </form>
                </div>
            </div>
        </header>
    );
}
