'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NutechLogo } from '@/components/ui/NutechLogo';

interface SidebarProps {
    userRole: string; // 'hod' | 'pro_hod' | 'lab_incharge' | 'lab_assistant' | 'student'
}

export function Sidebar({ userRole }: SidebarProps) {
    const pathname = usePathname();

    const isActive = (path: string) => pathname?.startsWith(path);

    const navItems = [
        {
            name: 'Dashboard',
            href: '/dashboard',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
            ),
            roles: ['all']
        },
        {
            name: 'My Inventory',
            href: '/inventory',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
            ),
            roles: ['lab_incharge', 'lab_assistant', 'hod', 'pro_hod']
        },
        {
            name: 'My Requests',
            href: '/clearance',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            roles: ['student']
        },
        {
            name: 'Review Requests',
            href: '/admin/clearance',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
            ),
            roles: ['hod', 'pro_hod', 'lab_incharge', 'lab_assistant']
        },
        {
            name: 'Procurement',
            href: '/procurement',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
            ),
            roles: ['hod', 'pro_hod', 'lab_incharge']
        },
        {
            name: 'Maintenance',
            href: '/maintenance',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            roles: ['lab_incharge', 'lab_assistant']
        },
        {
            name: 'User Management',
            href: '/admin/users',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
            roles: ['hod']
        },
    ];

    const filteredItems = navItems.filter(item =>
        item.roles.includes('all') || item.roles.includes(userRole)
    );

    return (
        <aside className="w-64 bg-[#105a4b] text-white min-h-screen flex flex-col shadow-xl">
            <div className="p-6 border-b border-[#0d473b]">
                <NutechLogo variant="light" />
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {filteredItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${active
                                ? 'bg-white/10 text-white font-medium shadow-sm'
                                : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            {item.icon}
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-[#0d473b]">
                <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-[#0d473b] flex items-center justify-center text-xs font-bold border border-white/20">
                        {userRole.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-white capitalize">{userRole.replace('_', ' ')}</p>
                        <Link href="/settings" className="text-xs text-gray-400 hover:text-gray-200">Settings</Link>
                    </div>
                </div>
            </div>
        </aside>
    );
}
