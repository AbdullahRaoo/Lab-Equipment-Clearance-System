'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NutechLogo } from '@/components/ui/NutechLogo';
import { UserRole, ROLE_LABELS } from '@/types/clearance';

interface SidebarProps {
    userRole: UserRole;
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
            roles: ['all'] as const
        },
        {
            name: 'Browse Equipment',
            href: '/inventory',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
            ),
            roles: ['all'] as const
        },
        {
            name: 'My Requests',
            href: '/requests',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            ),
            roles: ['student'] as const
        },
        {
            name: 'New Request',
            href: '/clearance',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
            ),
            roles: ['student'] as const
        },
        {
            name: 'Pending Approvals',
            href: '/requests',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            roles: ['lab_engineer', 'lab_assistant', 'oic_cen_labs', 'asst_oic_cen_labs', 'hod', 'pro_hod'] as const
        },
        {
            name: 'Manage Inventory',
            href: '/inventory',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            ),
            roles: ['lab_engineer', 'lab_assistant'] as const
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
            roles: ['lab_engineer', 'lab_assistant'] as const
        },
        {
            name: 'Procurement',
            href: '/procurement',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
            ),
            roles: ['oic_cen_labs', 'asst_oic_cen_labs', 'hod', 'pro_hod'] as const
        },
        {
            name: 'Analytics',
            href: '/admin/analytics',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
            roles: ['oic_cen_labs', 'asst_oic_cen_labs', 'hod', 'pro_hod'] as const
        },
        {
            name: 'User Management',
            href: '/admin/users',
            icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
            roles: ['oic_cen_labs', 'asst_oic_cen_labs', 'hod', 'pro_hod'] as const
        },
    ];

    const filteredItems = navItems.filter(item =>
        (item.roles as readonly string[]).includes('all') || (item.roles as readonly string[]).includes(userRole)
    );

    // Remove duplicate hrefs for same path
    const uniqueItems = filteredItems.reduce((acc, item) => {
        if (!acc.find(i => i.href === item.href)) {
            acc.push(item);
        }
        return acc;
    }, [] as typeof filteredItems);

    return (
        <aside className="w-64 bg-gradient-to-b from-[#105a4b] to-[#0d473b] text-white h-screen flex flex-col shadow-xl sticky top-0">
            <div className="p-6 border-b border-white/10">
                <Link href="/dashboard">
                    <NutechLogo variant="light" />
                </Link>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {uniqueItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${active
                                ? 'bg-white/15 text-white font-medium shadow-lg shadow-black/10'
                                : 'text-white/70 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <span className={active ? 'text-emerald-300' : ''}>{item.icon}</span>
                            <span>{item.name}</span>
                            {active && (
                                <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-white/10">
                <div className="px-4 py-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-sm font-bold shadow-lg">
                            {userRole.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                                {ROLE_LABELS[userRole] || userRole}
                            </p>
                            <Link href="/settings/profile" className="text-xs text-white/50 hover:text-white/80 transition-colors">
                                Settings
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
