import { getCurrentUser } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

export default async function AuthenticatedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            {/* Fixed Sidebar */}
            <div className="flex-shrink-0">
                <Sidebar userRole={user.role} />
            </div>

            {/* Scrollable Main Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header user={user} />

                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
